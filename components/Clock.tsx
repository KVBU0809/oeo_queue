
import React, { useState, useEffect } from 'react';

const Clock: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-end">
      <div className="text-3xl font-extrabold tracking-tighter text-indigo-400">
        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </div>
      <div className="text-sm font-medium text-slate-400">
        {time.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
      </div>
    </div>
  );
};

export default Clock;
