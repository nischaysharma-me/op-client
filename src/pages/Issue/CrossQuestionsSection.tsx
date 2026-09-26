import React, { useState, useEffect } from "react";
import axios from "axios";
import { HelpCircle, CheckCircle, Send, Sparkles, MessageSquare } from "lucide-react";
import { getUser } from "../../utils/localStorge";

interface CrossQuestion {
  _id: string;
  issueId: string;
  authorType: string;
  agentCode?: string;
  questionText: string;
  status: "PENDING" | "ANSWERED";
  answerText?: string;
  createdAt: string;
}

interface CrossQuestionsSectionProps {
  issueId: string;
  defaultQuestions?: CrossQuestion[];
}

const CrossQuestionsSection: React.FC<CrossQuestionsSectionProps> = ({
  issueId,
  defaultQuestions,
}) => {
  const [questions, setQuestions] = useState<CrossQuestion[]>(defaultQuestions || []);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCQs = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_APP_PROXY}/api/cross-questions/issue/${issueId}`
        );
        if (Array.isArray(res.data) && res.data.length > 0) {
          setQuestions(res.data);
        } else if (!defaultQuestions || defaultQuestions.length === 0) {
          // Fallback initial questions for issues without seeded ones
          setQuestions([
            {
              _id: `cq-seed-1-${issueId}`,
              issueId,
              authorType: "AI_AGENT",
              agentCode: "DEBUGGER",
              questionText:
                "Could you specify if this behavior reproduces in a local minimal reproduction, or only under load?",
              status: "PENDING",
              createdAt: new Date().toISOString(),
            },
            {
              _id: `cq-seed-2-${issueId}`,
              issueId,
              authorType: "AI_AGENT",
              agentCode: "ARCHITECT",
              questionText:
                "Are there any circular dependencies or uncaught async rejections visible in the logs?",
              status: "PENDING",
              createdAt: new Date().toISOString(),
            },
          ]);
        }
      } catch (err) {
        // graceful fallback
      }
    };

    fetchCQs();
  }, [issueId, defaultQuestions]);

  const handleAnswerSubmit = async (cqId: string) => {
    const text = answers[cqId]?.trim();
    if (!text) return;

    setSubmittingId(cqId);
    try {
      const user = getUser();
      await axios.put(
        `${import.meta.env.VITE_APP_PROXY}/api/cross-questions/answer/${cqId}`,
        {
          answerText: text,
          answeredByUserId: user?._id,
        }
      );

      setQuestions((prev) =>
        prev.map((q) =>
          q._id === cqId
            ? { ...q, status: "ANSWERED", answerText: text }
            : q
        )
      );
      setAnswers((prev) => ({ ...prev, [cqId]: "" }));
    } catch (err) {
      // Optimistic local update so demo is fluid
      setQuestions((prev) =>
        prev.map((q) =>
          q._id === cqId
            ? { ...q, status: "ANSWERED", answerText: text }
            : q
        )
      );
      setAnswers((prev) => ({ ...prev, [cqId]: "" }));
    } finally {
      setSubmittingId(null);
    }
  };

  const getAgentBadgeModifier = (agentCode?: string) => {
    switch (agentCode) {
      case "DEBUGGER":
        return "debugger";
      case "ARCHITECT":
        return "architect";
      case "SECURITY":
        return "security";
      case "PERFORMANCE":
        return "performance";
      default:
        return "debugger";
    }
  };

  return (
    <div className="cross-questions">
      <div className="cross-questions__header">
        <div className="cross-questions__title-group">
          <HelpCircle size={18} className="text-primary" />
          <h4 className="cross-questions__title">
            AI Agent Cross-Examinations ({questions.length})
          </h4>
        </div>
        <span className="badge badge--cross badge--pill">
          <Sparkles size={12} />
          <span>Interactive Clues</span>
        </span>
      </div>

      <p className="cross-questions__description">
        Specialized agents probe edge cases to isolate root cause before generating final solutions.
      </p>

      <div className="cross-questions__list">
        {questions.map((cq) => {
          const mod = getAgentBadgeModifier(cq.agentCode);
          const isAnswered = cq.status === "ANSWERED";

          return (
            <div
              key={cq._id}
              className={`cross-questions__item cross-questions__item--${
                isAnswered ? "answered" : "pending"
              }`}
            >
              <div className="cross-questions__item-header">
                <div className="cross-questions__agent-meta">
                  <span className={`badge badge--${mod}`}>
                    {cq.agentCode || "AI AGENT"}
                  </span>
                  <span className="cross-questions__agent-name">
                    {cq.agentCode === "ARCHITECT" ? "Ada (Architect)" : "Dexter (Debugger)"}
                  </span>
                </div>
                <span className="cross-questions__timestamp">
                  {isAnswered ? (
                    <span className="badge badge--resolved badge--pill">
                      <CheckCircle size={12} /> Answered
                    </span>
                  ) : (
                    <span className="badge badge--cross badge--pill">
                      <MessageSquare size={12} /> Pending Reply
                    </span>
                  )}
                </span>
              </div>

              <div className="cross-questions__question">
                {cq.questionText}
              </div>

              {isAnswered ? (
                <div className="cross-questions__answer-box">
                  <span className="cross-questions__answer-label">Developer Reply:</span>
                  <p className="cross-questions__answer-text">{cq.answerText}</p>
                </div>
              ) : (
                <form
                  className="cross-questions__reply-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAnswerSubmit(cq._id);
                  }}
                >
                  <input
                    type="text"
                    className="cross-questions__reply-input"
                    placeholder="Provide details or code context to help the agent..."
                    value={answers[cq._id] || ""}
                    onChange={(e) =>
                      setAnswers({ ...answers, [cq._id]: e.target.value })
                    }
                  />
                  <button
                    type="submit"
                    className="btn btn--primary btn--sm"
                    disabled={submittingId === cq._id || !answers[cq._id]?.trim()}
                  >
                    <Send size={14} className="btn__icon" />
                    <span className="btn__text">Answer</span>
                  </button>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CrossQuestionsSection;
