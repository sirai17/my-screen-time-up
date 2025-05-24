import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import { useLogs, DailyLog } from "../hooks/useLogs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
} from "recharts";

const History: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { getMonthlyLogs } = useLogs();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthlyLogs, setMonthlyLogs] = useState<DailyLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // Month is 1-indexed for display and fetching

  const fetchLogs = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const logs = await getMonthlyLogs(user.uid, currentYear, currentMonth);
      setMonthlyLogs(logs);
    } catch (e) {
      console.error("Error fetching monthly logs:", e);
      setError("Failed to load history data.");
    } finally {
      setIsLoading(false);
    }
  }, [user, currentYear, currentMonth, getMonthlyLogs]);

  useEffect(() => {
    if (user) {
      fetchLogs();
    } else {
      setMonthlyLogs([]); // Clear logs if user logs out
    }
  }, [user, fetchLogs]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 2, 1)); // currentMonth is 1-indexed, Date month is 0-indexed
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth, 1)); // currentMonth is 1-indexed
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate(); // month is 1-indexed
  };

  const getDayOfWeek = (year: number, month: number, day: number) => {
    return new Date(year, month - 1, day).getDay(); // month is 1-indexed, Date month is 0-indexed. 0 = Sunday
  };

  const daysInCurrentMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = getDayOfWeek(currentYear, currentMonth, 1); // 0 (Sun) to 6 (Sat)

  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
  }

  for (let day = 1; day <= daysInCurrentMonth; day++) {
    const dateStr = `${currentYear}${currentMonth.toString().padStart(2, "0")}${day.toString().padStart(2, "0")}`;
    const logForDay = monthlyLogs.find((log) => log.date === dateStr);
    const isToday =
      new Date().toDateString() ===
      new Date(currentYear, currentMonth - 1, day).toDateString();

    calendarDays.push(
      <div
        key={day}
        className={`calendar-day ${isToday ? "today" : ""} ${
          logForDay ? (logForDay.achieved ? "achieved" : "not-achieved") : ""
        }`}
      >
        <span className="day-number">{day}</span>
        {logForDay && (
          <span className="badge">
            {logForDay.achieved ? "🔥" : "💥"}
          </span>
        )}
      </div>
    );
  }

  // Prepare data for chart
  const chartData = Array.from({ length: daysInCurrentMonth }, (_, i) => {
    const day = i + 1;
    const dateStr = `${currentYear}${currentMonth.toString().padStart(2, "0")}${day.toString().padStart(2, "0")}`;
    const logForDay = monthlyLogs.find((log) => log.date === dateStr);
    return {
      name: `${day}`, // Day of the month
      usage: logForDay?.totalDurationMinutes || 0,
      goal: logForDay?.goalMinutes || 0, // Assuming goal might vary or be absent
    };
  });


  if (authLoading) {
    return <p>Authenticating...</p>;
  }

  if (!user) {
    return <p>Please sign in to view your history.</p>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <style>{`
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 5px;
          max-width: 600px;
          margin: 20px auto;
          text-align: center;
        }
        .calendar-day {
          border: 1px solid #eee;
          padding: 10px 5px;
          min-height: 60px;
          position: relative;
        }
        .calendar-day.empty {
          border: none;
        }
        .calendar-day .day-number {
          font-weight: bold;
        }
        .calendar-day .badge {
          position: absolute;
          top: 5px;
          right: 5px;
          font-size: 0.8em;
        }
        .calendar-day.today {
          background-color: #e0f7fa;
        }
        .calendar-day.achieved {
          background-color: #c8e6c9; /* Light green for achieved */
        }
        .calendar-day.not-achieved {
          background-color: #ffcdd2; /* Light red for not achieved */
        }
        .month-navigation {
          display: flex;
          justify-content: space-between;
          align-items: center;
          max-width: 300px;
          margin: 0 auto 20px auto;
        }
        .chart-container {
          margin-top: 30px;
          height: 300px; /* Fixed height for the chart container */
        }
      `}</style>
      <h1>Usage History</h1>

      <div className="month-navigation">
        <button onClick={handlePrevMonth}>&lt; Prev</button>
        <h2>
          {currentDate.toLocaleString("default", {
            month: "long",
            year: "numeric",
          })}
        </h2>
        <button onClick={handleNextMonth}>Next &gt;</button>
      </div>

      {isLoading && <p>Loading history...</p>}
      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      {!isLoading && !error && (
        <>
          <h3>Monthly Calendar</h3>
          <div className="calendar-grid">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} style={{ fontWeight: "bold" }}>{day}</div>
            ))}
            {calendarDays}
          </div>

          <h3>Daily Usage Chart (Minutes)</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="usage" fill="#8884d8" name="Usage Minutes" />
                <Line type="monotone" dataKey="goal" stroke="#ff7300" name="Goal Minutes" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
};

export default History;
