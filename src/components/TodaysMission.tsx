import { useState } from "react";

type Task = {
  id: number;
  title: string;
  time: string;
  completed: boolean;
};

function TodaysMission() {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 1,
      title: "Learn C Arrays",
      time: "20 min",
      completed: false,
    },
    {
      id: 2,
      title: "Solve 2 C Problems",
      time: "15 min",
      completed: false,
    },
    {
      id: 3,
      title: "Work on Your Project",
      time: "10 min",
      completed: false,
    },
  ]);

  const toggleTask = (id: number) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === id
          ? { ...task, completed: !task.completed }
          : task
      )
    );
  };

  const completedTasks = tasks.filter(
    (task) => task.completed
  ).length;

  const progress = (completedTasks / tasks.length) * 100;

  return (
    <section className="todays-mission">
      <h2>🎯 What Should I Do Today?</h2>

      <p>Good afternoon 👋</p>

      <p>
        You have <strong>45 minutes</strong> today.
      </p>

      <div className="mission-card">
        <h3>Today's Mission</h3>

        {tasks.map((task) => (
          <div
            className={`task ${task.completed ? "completed" : ""}`}
            key={task.id}
            onClick={() => toggleTask(task.id)}
          >
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => toggleTask(task.id)}
              onClick={(event) => event.stopPropagation()}
            />

            <div>
              <strong>{task.title}</strong>
              <p>{task.time}</p>
            </div>
          </div>
        ))}

        <div className="progress-section">
          <div>
            <span>Today's Progress</span>
            <span>
              {completedTasks} / {tasks.length} completed
            </span>
          </div>

          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <p>
          🔥 Current Streak: <strong>4 days</strong>
        </p>

        <div className="mission-buttons">
          <button>Start Today's Mission</button>
          <button>View My Roadmap</button>
        </div>
      </div>
    </section>
  );
}

export default TodaysMission;