import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BarChart3, Users, CheckCircle, FileText } from "lucide-react";
import surveysApi from "./surveys.api";

export default function SurveyResultsPage() {
  const { surveyId } = useParams();

  const { data: surveyData, isLoading: surveyLoading } = useQuery({
    queryKey: ["surveys", surveyId],
    queryFn: () => surveysApi.get(surveyId),
  });

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["surveys", surveyId, "stats"],
    queryFn: () => surveysApi.getStats(surveyId),
  });

  if (surveyLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (!surveyData || !statsData) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Survey not found</AlertDescription>
      </Alert>
    );
  }

  const { survey } = surveyData;
  const { stats, questions } = statsData;

  const responseRate = stats.total_sent > 0
    ? ((stats.total_submitted / stats.total_sent) * 100).toFixed(1)
    : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{survey.title}</h1>
        <p className="text-muted-foreground mt-2">Survey Results & Analytics</p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_sent}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Submitted</CardTitle>
            <CheckCircle className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_submitted}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <FileText className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_draft}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <BarChart3 className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{responseRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Question Results */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Question Breakdown</h2>
        {questions?.map((q) => (
          <Card key={q.question_id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">
                    Q{q.question_order}. {q.question_text}
                  </CardTitle>
                  <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                    <span>{q.response_count} responses</span>
                    <span>Average: {q.avg_rating}/5</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = q[`rating_${rating}`];
                  const percentage = q.response_count > 0
                    ? ((count / q.response_count) * 100).toFixed(0)
                    : 0;
                  
                  return (
                    <div key={rating} className="flex items-center gap-3">
                      <span className="text-sm font-medium w-16">
                        {rating} {rating === 5 ? "(SA)" : rating === 1 ? "(SD)" : ""}
                      </span>
                      <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                        <div
                          className={`h-full flex items-center justify-end px-2 text-xs font-medium text-white transition-all ${
                            rating >= 4
                              ? "bg-green-500"
                              : rating === 3
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${percentage}%` }}
                        >
                          {percentage > 10 && `${percentage}%`}
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground w-12 text-right">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}