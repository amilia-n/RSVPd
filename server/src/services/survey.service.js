import pool from "../db/pool.js";
import { queries } from "../db/queries.js";


export async function createSurvey(payload) {
  const { event_id, org_id, title, description_md = null, created_by } = payload;
  const { rows } = await pool.query(queries.createSurvey, [
    event_id, org_id, title, description_md, created_by
  ]);
  return rows[0] || null;
}

export async function getSurveyById(id) {
  const { rows } = await pool.query(queries.getSurveyById, [id]);
  return rows[0] || null;
}

export async function updateSurvey(id, patch) {
  const { title, description_md = null } = patch;
  const { rows } = await pool.query(queries.updateSurvey, [id, title, description_md]);
  return rows[0] || null;
}

export async function publishSurvey(id) {
  const { rows } = await pool.query(queries.publishSurvey, [id]);
  return rows[0] || null;
}

export async function markSurveySent(id) {
  const { rows } = await pool.query(queries.markSurveySent, [id]);
  return rows[0] || null;
}

export async function listSurveysForEvent(event_id) {
  const { rows } = await pool.query(queries.listSurveysForEvent, [event_id]);
  return rows;
}

export async function listSurveysForOrg(org_id) {
  const { rows } = await pool.query(queries.listSurveysForOrg, [org_id]);
  return rows;
}

export async function deleteSurvey(id) {
  const { rows } = await pool.query(queries.deleteSurvey, [id]);
  return rows[0] || null;
}


export async function createSurveyQuestion(survey_id, question_text, question_order) {
  const { rows } = await pool.query(queries.createSurveyQuestion, [
    survey_id, question_text, question_order
  ]);
  return rows[0] || null;
}

export async function listQuestionsForSurvey(survey_id) {
  const { rows } = await pool.query(queries.listQuestionsForSurvey, [survey_id]);
  return rows;
}

export async function updateSurveyQuestion(id, question_text, question_order) {
  const { rows } = await pool.query(queries.updateSurveyQuestion, [
    id, question_text, question_order
  ]);
  return rows[0] || null;
}

export async function deleteQuestion(id) {
  const { rows } = await pool.query(queries.deleteQuestion, [id]);
  return rows[0] || null;
}


export async function createSurveyRecipient(survey_id, user_id, ticket_id = null, notification_id = null) {
  const { rows } = await pool.query(queries.createSurveyRecipient, [
    survey_id, user_id, ticket_id, notification_id
  ]);
  return rows[0] || null;
}

export async function getSurveyRecipient(survey_id, user_id) {
  const { rows } = await pool.query(queries.getSurveyRecipient, [survey_id, user_id]);
  return rows[0] || null;
}

export async function updateRecipientStatus(survey_id, user_id, status) {
  const { rows } = await pool.query(queries.updateRecipientStatus, [survey_id, user_id, status]);
  return rows[0] || null;
}

export async function updateRecipientDraft(survey_id, user_id, draft_data) {
  const { rows } = await pool.query(queries.updateRecipientDraft, [survey_id, user_id, draft_data]);
  return rows[0] || null;
}

export async function listRecipientsForSurvey(survey_id) {
  const { rows } = await pool.query(queries.listRecipientsForSurvey, [survey_id]);
  return rows;
}

export async function listSurveysForUser(user_id) {
  const { rows } = await pool.query(queries.listSurveysForUser, [user_id]);
  return rows;
}

// ═══════════════════════════════════════════════════════════════
// SURVEY RESPONSES
// ═══════════════════════════════════════════════════════════════

export async function createSurveyResponse(survey_id, question_id, user_id, ticket_id, rating) {
  const { rows } = await pool.query(queries.createSurveyResponse, [
    survey_id, question_id, user_id, ticket_id, rating
  ]);
  return rows[0] || null;
}

export async function listResponsesForSurvey(survey_id) {
  const { rows } = await pool.query(queries.listResponsesForSurvey, [survey_id]);
  return rows;
}

export async function listResponsesForUser(survey_id, user_id) {
  const { rows } = await pool.query(queries.listResponsesForUser, [survey_id, user_id]);
  return rows;
}


export async function getSurveyStats(survey_id) {
  const { rows } = await pool.query(queries.getSurveyStats, [survey_id]);
  return rows[0] || null;
}

export async function getQuestionStats(survey_id) {
  const { rows } = await pool.query(queries.getQuestionStats, [survey_id]);
  return rows;
}