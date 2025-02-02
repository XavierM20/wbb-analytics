import React, { useState } from 'react';
import './ShotPopup.css';
import ClickAwayListener from 'react-click-away-listener';

function ShotPopup({ isOpen, onClose, gameOrDrill_id, onModel, player_id, zone }) {
    const [shotOutcome, setShotOutcome] = useState(null); // 'made' or 'missed'
    const serverUrl = process.env.REACT_APP_SERVER_URL;
    const submitShot = async (isMade, shotClockTime) => {
        const shotData = {
            gameOrDrill_id: gameOrDrill_id,
            onModel: onModel,
            player_id: player_id,
            made: isMade === 'made',
            zone: zone,
            shot_clock_time: shotClockTime,
            timestamp: new Date()
        };

        try {
            // Corrected: Added 'await' here to wait for the fetch call to resolve
            const response = await fetch(`${serverUrl}/api/shots`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(shotData)
            });

            // Corrected: Added 'await' here to ensure the response body is fully read and parsed as JSON
            const submittedShot = await response.json();
            console.log('Shot submitted:', submittedShot);

            // Reset and close logic here
            resetAndClose(); // Assuming this function exists and is responsible for UI behavior

            try {

                // Fetch drill to get data to update
                const drillResponse = await fetch(serverUrl + `/api/drills/${gameOrDrill_id}`);
                const drillData = await drillResponse.json();
                drillData.shot_events.push(submittedShot._id);

                // Remove _id and __v from drillData
                delete drillData._id;
                delete drillData.__v;

                // Check if player_id is in players_involved, if not, add them
                if (!drillData.players_involved.includes(player_id)) {
                    drillData.players_involved.push(player_id);
                }

                // Update the drill with the new tempo event
                const response = await fetch(serverUrl + `/api/drills/${gameOrDrill_id}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(drillData)
                });
                const updatedDrill = await response.json();
                console.log('Drill updated:', updatedDrill);

            } catch (error) {
                console.error('Error updating drill:', error);
            }

        } catch (error) {
            console.error('Error submitting shot:', error);
        }
    };

    const resetAndClose = () => {
        setShotOutcome(null);
        onClose();
    };

    const handleClockTimeSelection = (timeMapping) => {
        if (shotOutcome) {
            submitShot(shotOutcome === 'made', timeMapping);
        }
    };

    const handleShotOutcome = (outcome) => {
        setShotOutcome(outcome);
    };

    return isOpen ? (
        <ClickAwayListener onClickAway={resetAndClose}>
            <div className="ShotPopup">
                <div className="ShotOutcomeSelection">
                    {!shotOutcome ? (
                        <>
                            <div className="MadeButton" onClick={() => handleShotOutcome('made')}>Made</div>
                            <div className="MissedButton" onClick={() => handleShotOutcome('missed')}>Missed</div>
                        </>
                    ) : (
                        <div className="ClockTimeSelection">
                            <div className="ClockButton1" onClick={() => handleClockTimeSelection('first_third')}>30-21</div>
                            <div className="ClockButton2" onClick={() => handleClockTimeSelection('second_third')}>20-11</div>
                            <div className="ClockButton3" onClick={() => handleClockTimeSelection('final_third')}>10-1</div>
                        </div>
                    )}
                </div>
            </div>
        </ClickAwayListener>
    ) : null;
}

export default ShotPopup;
