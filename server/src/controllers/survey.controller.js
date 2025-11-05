import * as survey from "../services/survey.service.js";
import * as notif from "../services/notification.service.js";
import pool from "../db/pool.js";
import { queries } from "../db/queries.js";


export async function create(req, res) {
  try {
    const { event_id, org_id, title, description_md, questions } = req.body;
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const surveyResult = await client.query(queries.createSurvey, [
        event_id, org_id, title, description_md, req.user.id
      ]);
      const newSurvey = surveyResult.rows[0];

      if (questions && Array.isArray(questions)) {
        const limitedQuestions = questions.slice(0, 5);
        for (let i = 0; i < limitedQuestions.length; i++) {
          await client.query(queries.createSurveyQuestion, [
            newSurvey.id,
            limitedQuestions[i].question_text,
            i + 1
          ]);
        }
      }

      await client.query('COMMIT');
      
      const questionsList = await survey.listQuestionsForSurvey(newSurvey.id);
      
      return res.status(201).json({ survey: newSurvey, questions: questionsList });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: { message: e.message || "Bad Request" } });
  }
}

export async function get(req, res) {
  try {
    const surveyData = await survey.getSurveyById(req.params.id);
    if (!surveyData) return res.status(404).json({ error: { message: "Not found" } });
    
    const questions = await survey.listQuestionsForSurvey(req.params.id);
    return res.json({ survey: surveyData, questions });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: { message: "Internal Server Error" } });
  }
}

export async function update(req, res) {
  try {
    const row = await survey.updateSurvey(req.params.id, req.body ?? {});
    return res.json({ survey: row });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: { message: "Bad Request" } });
  }
}

export async function listForEvent(req, res) {
  try {
    const rows = await survey.listSurveysForEvent(req.params.eventId);
    return res.json({ rows });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: { message: "Bad Request" } });
  }
}

export async function listForOrg(req, res) {
  try {
    const rows = await survey.listSurveysForOrg(req.params.orgId);
    return res.json({ rows });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: { message: "Bad Request" } });
  }
}

export async function deleteSurvey(req, res) {
  try {
    const row = await survey.deleteSurvey(req.params.id);
    return res.json({ deleted: row });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: { message: "Bad Request" } });
  }
}


export async function sendSurvey(req, res) {
  try {
    const { survey_id } = req.body;
    
    if (!survey_id) {
      return res.status(400).json({ error: { message: "Missing survey_id" } });
    }

    const surveyData = await survey.getSurveyById(survey_id);
    if (!surveyData) {
      return res.status(404).json({ error: { message: "Survey not found" } });
    }

    const { rows: tickets } = await pool.query(
      `SELECT DISTINCT t.id AS ticket_id, o.purchaser_user_id AS user_id, o.purchaser_email
       FROM tickets t
       JOIN orders o ON o.id = t.order_id
       WHERE t.event_id = $1 AND t.status = 'ACTIVE' AND o.purchaser_user_id IS NOT NULL`,
      [surveyData.event_id]
    );

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const ticket of tickets) {
        const notification = await notif.enqueueNotification({
          org_id: surveyData.org_id,
          event_id: surveyData.event_id,
          title: `Survey: ${surveyData.title}`,
          body_md: surveyData.description_md || 'Please take a moment to complete our post-event survey.',
          channel: 'IN_APP',
          target_user_id: ticket.user_id,
          published_by: req.user.id,
        });

        try {
          await notif.sendNotificationToMagicBell(notification.id);
        } catch (notifError) {
          console.error('MagicBell send error:', notifError);
        }

        await client.query(queries.createSurveyRecipient, [
          survey_id,
          ticket.user_id,
          ticket.ticket_id,
          notification.id
        ]);
      }

      await client.query(queries.markSurveySent, [survey_id]);

      await client.query('COMMIT');
      
      return res.json({ 
        success: true,
        recipients_count: tickets.length,
        message: `Survey sent to ${tickets.length} attendees`
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (e) {
    console.error('Survey send error:', e);
    return res.status(500).json({ error: { message: "Failed to send survey" } });
  }
}


export async function listForUser(req, res) {
  try {
    const rows = await survey.listSurveysForUser(req.user.id);
    return res.json({ rows });
  } catch (e) {
    console.error(e);
    return res.status(401).json({ error: { message: "Unauthorized" } });
  }
}

export async function saveDraft(req, res) {
  try {
    const { survey_id, draft_data } = req.body;
    
    const row = await survey.updateRecipientDraft(survey_id, req.user.id, draft_data);
    return res.json({ recipient: row });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: { message: "Bad Request" } });
  }
}

export async function submitResponse(req, res) {
  try {
    const { survey_id, responses } = req.body;
    
    if (!responses || !Array.isArray(responses)) {
      return res.status(400).json({ error: { message: "Invalid responses format" } });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const recipient = await survey.getSurveyRecipient(survey_id, req.user.id);
      if (!recipient) {
        throw new Error('Not a valid survey recipient');
      }

      for (const resp of responses) {
        await client.query(queries.createSurveyResponse, [
          survey_id,
          resp.question_id,
          req.user.id,
          recipient.ticket_id,
          resp.rating
        ]);
      }

      await client.query(queries.updateRecipientStatus, [survey_id, req.user.id, 'SUBMITTED']);

      await client.query('COMMIT');
      
      return res.json({ success: true, message: 'Survey submitted successfully' });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: { message: e.message || "Bad Request" } });
  }
}

export async function getStats(req, res) {
  try {
    const stats = await survey.getSurveyStats(req.params.id);
    const questionStats = await survey.getQuestionStats(req.params.id);
    
    return res.json({ stats, questions: questionStats });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: { message: "Bad Request" } });
  }
}

export async function getResponses(req, res) {
  try {
    const rows = await survey.listResponsesForSurvey(req.params.id);
    return res.json({ rows });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: { message: "Bad Request" } });
  }
}