import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Save, Send, CheckCircle } from "lucide-react";
import surveysApi from "./surveys.api";

export default function SurveyResponsePage() {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [responses, setResponses] = useState({});

  // Fetch survey details
  const { data: surveyData, isLoading } = useQuery({
    queryKey: ["surveys", surveyId],
    queryFn: () => surveysApi.get(surveyId),
  });

  // Load draft data if available
  useEffect(() => {
    if (surveyData?.survey?.draft_data && Object.keys(surveyData.survey.draft_data).length > 0) {
      setResponses(surveyData.survey.draft_data);
    }
  }, [surveyData]);

  // Save draft mutation
  const saveDraftMutation = useMutation({
    mutationFn: (draft_data) =>
      surveysApi.saveDraft({ survey_id: surveyId, draft_data }),
    onSuccess: () => {
      alert("Draft saved successfully!");
    },
  });

  // Submit response mutation
  const submitMutation = useMutation({
    mutationFn: (responsesArray) =>
      surveysApi.submit({ survey_id: surveyId, responses: responsesArray }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["surveys"] });
      navigate("/dashboard");
    },
  });

  const handleRatingChange = (questionId, rating) => {
    setResponses({
      ...responses,
      [questionId]: rating,
    });
  };

  const handleSaveDraft = () => {
    saveDraftMutation.mutate(responses);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate all questions answered
    const allQuestionsAnswered = surveyData?.questions?.every(
      (q) => responses[q.id] !== undefined
    );

    if (!allQuestionsAnswered) {
      alert("Please answer all questions before submitting");
      return;
    }

    // Convert to array format
    const responsesArray = surveyData.questions.map((q) => ({
      question_id: q.id,
      rating: responses[q.id],
    }));

    if (confirm("Are you sure you want to submit this survey? You cannot change your responses after submission.")) {
      submitMutation.mutate(responsesArray);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (!surveyData) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Survey not found</AlertDescription>
      </Alert>
    );
  }

  const { survey, questions } = surveyData;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{survey.title}</h1>
        {survey.description_md && (
          <p className="text-muted-foreground mt-2">{survey.description_md}</p>
        )}
      </div>

      <Alert>
        <AlertDescription>
          Rate each statement from 1 (Strongly Disagree) to 5 (Strongly Agree)
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit} className="space-y-6">
        {questions?.map((question, index) => (
          <Card key={question.id}>
            <CardHeader>
              <CardTitle className="text-lg">
                {index + 1}. {question.question_text}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                  <span>Strongly Disagree</span>
                  <span>Strongly Agree</span>
                </div>
                <div className="flex gap-4 justify-center">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <label
                      key={rating}
                      className="flex flex-col items-center cursor-pointer"
                    >
                      <input
                        type="radio"
                        name={`question_${question.id}`}
                        value={rating}
                        checked={responses[question.id] === rating}
                        onChange={() => handleRatingChange(question.id, rating)}
                        className="size-6 cursor-pointer"
                        required
                      />
                      <span className="text-sm font-medium mt-1">{rating}</span>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveDraft}
            disabled={saveDraftMutation.isPending || Object.keys(responses).length === 0}
          >
            <Save className="size-4 mr-2" />
            {saveDraftMutation.isPending ? "Saving..." : "Save & Return"}
          </Button>
          <Button
            type="submit"
            disabled={submitMutation.isPending}
          >
            <Send className="size-4 mr-2" />
            {submitMutation.isPending ? (
              <>
                <Spinner className="mr-2" />
                Submitting...
              </>
            ) : (
              "Submit Survey"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}