import React from "react";
import "../TeamStats.css"; // Ensure you have the CSS file for styling

const TeamLeader = ({ leader, label }) => {
    return (
        <div className="leader-category">
            <h4>{label}</h4>
            <p>
              <strong>{leader.player.name}</strong>
            </p>
            <p className="stat">{leader.statValue}</p>
          </div>
    );
}

export default TeamLeader;