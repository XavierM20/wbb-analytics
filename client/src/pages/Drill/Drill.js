import React, { useState, useEffect } from 'react';
import './Drill.css';
import CancelButton from './components/CancelButton';
import LastTempoDisplay from './components/LastTempoDisplay';
import PlayerList from './components/PlayerList';
import TempoTimer from './components/TempoTimer';
import TempoButton from './components/TempoButton';
import SubstitutionPopup from './components/SubstitutionPopup';
import ShotPopup from './components/ShotPopup';
import ImageMapper from "react-img-mapper";
import basketballCourtVector from './components/basketball-court-vector.jpg';
import ExtraStats from './components/ExtraStats';
import ExtraStatPopup from './components/ExtraStatPopup';
import { set } from 'mongoose';
import { useNavigate } from 'react-router-dom';


function DrillPage() {
    // State hooks for timing and tempo tracking
    const [isTiming, setIsTiming] = useState(false);
    const [resetTimer, setResetTimer] = useState(false);
    const [currentTempo, setCurrentTempo] = useState(0);
    const [recordedTempo, setRecordedTempo] = useState(null);
    const [lastTempo, setLastTempo] = useState(0);
    const [tempoType, setTempoType] = useState(null);
    const [avgTempo, setAvgTempo] = useState(0);
    const [tempoCount, setTempoCount] = useState(1);
    const [totalTempo, setTotalTempo] = useState(0);

    const navigate = useNavigate();
    
    // State hooks for player and popup management
    const [playersOnCourt, setPlayersOnCourt] = useState([]);
    const [allPlayers, setAllPlayers] = useState([]);
    const [isPlayerSelectedforShot, setIsPlayerSelectedforShot] = useState(false);
    const [player, setPlayer] = useState(null);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [selectedPlayerForSub, setSelectedPlayerForSub] = useState(null);
    const [isShotPopupOpen, setIsShotPopupOpen] = useState(false);
    const [selectedZone, setSelectedZone] = useState(null);
    const [isESOpen, setIsESOpen] = useState(false);
    const [statName, setStatName] = useState("");

    // Server URL from environment variables for API requests
    const serverUrl = process.env.REACT_APP_SERVER_URL;

    // Extracting practice and drill IDs from the URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const drillID = urlParams.get('DrillID');
    const practiceID = urlParams.get('PracticeID');


    // Fetch players from the server on component mount
    useEffect(() => {

        fetch(serverUrl + '/api/players')
            .then(response => response.json())
            .then(data => {
                const playersData = data.map(player => ({
                    id: player._id,
                    name: player.name,
                    number: player.jersey_number
                }));
                setAllPlayers(playersData);
                setPlayersOnCourt(playersData.slice(0, 5)); // Example: Set the first five players as on court
            })
            .catch(error => console.error('Failed to fetch players:', error));
    }, [serverUrl]);

    // Function to submit tempo
    const submitTempo = async (isOffensive, playersOnCourtIds, timeValue) => {
        const tempoData = {
            gameOrDrill_id: drillID,
            player_ids: playersOnCourtIds,
            onModel: 'Drill',
            tempo_type: isOffensive,
            transition_time: timeValue.toFixed(2),
            timestamp: new Date()
        };

        try {
            // Add 'await' here to wait for the fetch call to resolve
            const response = await fetch(serverUrl + '/api/tempos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(tempoData)
            });
            const submitTempo = await response.json();
            console.log('Tempo submitted:', submitTempo);

            try {

                // Fetch drill to get data to update
                const drillResponse = await fetch(serverUrl + `/api/drills/${drillID}`);
                const drillData = await drillResponse.json();
                drillData.tempo_events.push(submitTempo._id);

                // Remove _id and __v from drillData
                delete drillData._id;
                delete drillData.__v;

                // Update the drill with the new tempo event
                const response = await fetch(serverUrl + `/api/drills/${drillID}`, {
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
            console.error('Error submitting tempo:', error);
        }
    };


    // Start timing for tempo (offensive or defensive)
    const startTempo = (type) => {
        console.log(`Starting ${type} tempo`);
        if (recordedTempo) {
            setLastTempo(recordedTempo.toFixed(2));
            setTempoCount(tempoCount + 1);
            setTotalTempo(totalTempo + recordedTempo);
            setAvgTempo(((recordedTempo + totalTempo) / tempoCount).toFixed(2));
        }
        setCurrentTempo(0);
        setResetTimer(true);
        setTempoType(type);
        setIsTiming(true);
    };

    // Stop the current tempo
    const handleStopTempo = (type) => {
        console.log(`Stopping ${tempoType} tempo`);
        setIsTiming(false);
        setRecordedTempo(currentTempo);

        // Determine if tempo is offensive or defensive
        const isOffensive = type;

        // Get the IDs of the players on the court
        const playersOnCourtIds = playersOnCourt.map(player => player.id);

        // Call submitTempo with the correct arguments
        submitTempo(isOffensive, playersOnCourtIds, currentTempo);
    };

    // Cancel the current timing
    const cancelTempo = () => {
        console.log('Cancelling tempo');
        setIsTiming(false);
        setCurrentTempo(0);
        setResetTimer(true);
        setTempoType(null);
    };

    // Handle substitution with a new player
    const handleSubstitute = (newPlayer) => {
        console.log(`Substituting player ${selectedPlayerForSub.number} with ${newPlayer.number}`);
        setPlayersOnCourt(playersOnCourt.map(p =>
            p.number === selectedPlayerForSub.number ? newPlayer : p
        ));
        setIsPopupOpen(false);
        setIsPlayerSelectedforShot(false);
    };

    const handleOverlayClick = () => {
        setIsPopupOpen(false);
        setIsPlayerSelectedforShot(false);
    };

    let MAP2 = {
        name: "my-map",
        areas: [
            // { name: "3", shape: "poly", coords: [49, 3, 58, 79, 210, 79, 210, 3], fillColor: "#4f2984", preFillColor: "rgba(52, 52, 52, 0.2)", strokeColor: "green" },
            // { name: "2", shape: "poly", coords: [385, 3, 385, 83, 540, 83, 548, 3], fillColor: "#4f2984", preFillColor: "rgba(52, 52, 52, 0.2)", strokeColor: "green" },
            // { name: "1", shape: "poly", coords: [215, 3, 215, 230, 380, 230, 380, 3], fillColor: "#4f2984", preFillColor: "rgba(52, 52, 52, 0.2)", strokeColor: "purple" },
            // { name: "5", shape: "poly", coords: [56, 83, 210, 83, 210, 235, 300, 235, 300, 316, 245, 312, 239, 310, 220, 305, 176, 285, 140, 260, 115, 235, 100, 210, 85, 185, 75, 160, 65, 120], fillColor: "#4f2984", preFillColor: "rgba(52, 52, 52, 0.2)", strokeColor: "red" },
            // { name: "4", shape: "poly", coords: [60, 83, 215, 83, 215, 235, 300, 235, 300, 316, 240, 310, 238, 310, 218, 302, 173, 280, 149, 264, 129, 238, 100, 196, 85, 170, 75, 145].map((n, i, arr) => (i % 2 === 0 ? 600 - n : n)), fillColor: "#4f2984", preFillColor: "rgba(52, 52, 52, 0.2)", strokeColor: "red" },
            // { name: "8", shape: "poly", coords: [160, 280, 0, 550, 600, 550, 445, 275, 410, 295, 360, 315, 300, 320, 245, 315, 195, 299], fillColor: "#4f2984", preFillColor: "rgba(52, 52, 52, 0.2)", strokeColor: "blue" },
            // { name: "7", shape: "poly", coords: [0, 3, 45, 3, 53, 83, 70, 155, 80, 180, 90, 200, 100, 220, 110, 235, 120, 245, 130, 255, 140, 265, 160, 280, 0, 550], fillColor: "#4f2984", preFillColor: "rgba(52, 52, 52, 0.2)", strokeColor: "blue" },
            // { name: "6", shape: "poly", coords: [600, 3, 553, 3, 545, 83, 534, 130, 520, 170, 490, 220, 445, 275, 600, 550], fillColor: "#4f2984", preFillColor: "rgba(52, 52, 52, 0.2)", strokeColor: "blue" },
            //scale 3 to the size 300x245
            {name: "3", shape: "poly", coords: [25, 1.5, 26, 20, 29, 40, 105, 40, 105, 1.5], fillColor: "#4f2984", preFillColor: "rgba(52, 52, 52, 0.2)", strokeColor: "green"},
            {name: "2", shape: "poly", coords: [193, 1.5, 193, 40, 270, 40, 273, 20, 275, 1.5], fillColor: "#4f2984", preFillColor: "rgba(52, 52, 52, 0.2)", strokeColor: "green"},
            {name: "1", shape: "poly", coords: [108, 1.5, 108, 102, 190, 102, 190, 1.5], fillColor: "#4f2984", preFillColor: "rgba(52, 52, 52, 0.2)", strokeColor: "purple"},
            {name: "5", shape: "poly", coords: [30, 45, 103, 45, 103, 107, 150, 107, 150, 141, 126, 138, 115, 135, 110, 134, 100, 131, 95, 129, 90, 127, 85, 125, 74, 117, 65, 110, 40, 78, 38, 70], fillColor: "#4f2984", preFillColor: "rgba(52, 52, 52, 0.2)", strokeColor: "red"},
            {name: "4", shape: "poly", coords: [30, 45, 108, 45, 108, 107, 150, 107, 150, 141, 126, 138, 115, 135, 110, 134, 100, 131, 95, 129, 90, 127, 85, 125, 74, 117, 65, 110, 40, 78, 38, 70].map((n, i, arr) => (i % 2 === 0 ? 300 - n : n)), fillColor: "#4f2984", preFillColor: "rgba(52, 52, 52, 0.2)", strokeColor: "red"},
            {name: "8", shape: "poly", coords: [80, 127, 0, 250, 300, 250, 220, 127, 205, 134, 180, 141, 150, 145, 122, 142, 98, 135], fillColor: "#4f2984", preFillColor: "rgba(52, 52, 52, 0.2)", strokeColor: "blue"},
            {name: "7", shape: "poly", coords: [0, 1.5, 20, 1.5, 23, 34, 35, 75, 40, 85, 45, 92, 50, 99, 55, 105, 60, 110, 65, 116, 70, 120, 79, 127, 0, 250], fillColor: "#4f2984", preFillColor: "rgba(52, 52, 52, 0.2)", strokeColor: "blue"},
            {name: "6", shape: "poly", coords: [300, 1.5, 278, 1.5, 275, 34, 265, 75, 260, 85, 255, 92, 250, 99, 245, 105, 240, 110, 235, 116, 230, 120, 221, 127, 300, 250], fillColor: "#4f2984", preFillColor: "rgba(52, 52, 52, 0.2)", strokeColor: "blue"}


        ]
    };


    const handleCourtOverlayClick = () => {
        //setIsShotPopupOpen(false);
        setIsPlayerSelectedforShot(false);
        setIsShotPopupOpen(false);
    };


    const handleCourtClick = (area) => {
        console.log(`Player ${area} clicked for shot`);
        setSelectedZone(area);
        setIsShotPopupOpen(true);
    }

    const courtClicked = (area) => {
        console.log(area);
        handleCourtClick(area.name);
    }

    const handleShotPopupClose = () => {
        setIsShotPopupOpen(false);
        setIsPlayerSelectedforShot(false);
    }


    // Example method signatures in the TempoPage component
    const onPlayerSelectForShot = (player) => {
        setIsPlayerSelectedforShot(true);
        setPlayer(player);
    };

    const onPlayerSelectForSub = (player) => {
        setSelectedPlayerForSub(player); // Set the player selected for substitution
        setIsPopupOpen(true); // Open the substitution popup
    };

    const handleESClose = () => {
        setIsESOpen(false);
    }

    const recordStats = async (player, route) => {
        if (isPlayerSelectedforShot) {

            setIsESOpen(true);

            // Fetch the player's stats from the server
            const statResponse = await fetch(`${serverUrl}/api/stats/byPlayer/${player.id}`);
            if (!statResponse.ok) {
                console.error(`Failed to fetch player stats: HTTP Error: ${statResponse.status}`);
                return;
            }
            const playerStatsArray = await statResponse.json();

            if (!playerStatsArray.length) {
                console.error('No stats found for player:', player.id);
                return; // Exit if no stats found
            }

            // Assuming the first object is the one we want to update
            const filteredPlayerStatsArray = playerStatsArray.filter(array => array.drill_id === drillID);

            const playerStats = filteredPlayerStatsArray[0];

            // Submit the updated stats to the server
            try {
                const response = await fetch(`${serverUrl}/api/stats/${route}/${playerStats._id}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                if (!response.ok) {
                    throw new Error(`HTTP Error: ${response.status}`);
                }
                const updatedStats = await response.json();
                console.log('Stats updated:', updatedStats);
            } catch (error) {
                console.error('Error updating stats:', error);
            }
        }
    };


    return (
        <div className="background-container">
            <button className='btn-home top-right-button' onClick={() => navigate('/homepage')}>Home</button>
            <div className="drill-container">
                <div className="player-and-court-container">
                    <div className="player-container">
                        <PlayerList
                            players={playersOnCourt}
                            onPlayerSelectForShot={onPlayerSelectForShot}
                            onPlayerSelectForSub={onPlayerSelectForSub}
                        />
                        {isPopupOpen && (
                            <>
                                <div className="Overlay" onClick={handleOverlayClick}></div>
                                <SubstitutionPopup
                                    isOpen={isPopupOpen}
                                    onClose={() => setIsPopupOpen(false)}
                                    onSubstitute={handleSubstitute}
                                    playersOnCourt={playersOnCourt}
                                    allPlayers={allPlayers}
                                />
                            </>
                        )}
                    </div>
                    <div className="TimerAndLastTempo">
                        <TempoTimer
                            isTiming={isTiming}
                            resetTimer={resetTimer}
                            setResetTimer={setResetTimer}
                            currentTime={currentTempo}
                            setCurrentTime={setCurrentTempo}
                        />
                        <LastTempoDisplay lastTempo={lastTempo} />
                        <div className="cancel-button-container">
                            <CancelButton
                                onCancel={cancelTempo}
                                lassName={!isTiming ? 'disabled' : ''}
                                disabled={!isTiming}
                            />
                        </div>
                    </div>
                    <div className="court-container">
                        <ImageMapper
                            src={basketballCourtVector}
                            map={MAP2}
                            width={300}
                            height={245}
                            lineWidth={5}
                            strokeColor={"white"}
                            onClick={courtClicked}
                        />
                        {isShotPopupOpen && isPlayerSelectedforShot && (
                            <>
                                <div className="Overlay" onClick={handleCourtOverlayClick}></div>
                                <ShotPopup
                                    isOpen={isShotPopupOpen}
                                    onClose={() => handleShotPopupClose()}
                                    gameOrDrill_id={drillID}
                                    onModel="Drill"
                                    player_id={player.id}
                                    zone={selectedZone}
                                />
                            </>
                        )}
                    </div>
                </div>
                <div className="extra-stats-container">
                    <ExtraStats
                        setStatName={"Offensive Rebound"}
                        className="Offensive Rebound"
                        onClick={() => recordStats(player, 'offensiveRebound')}
                    />
                    <ExtraStats
                        setStatName={"Assist"}
                        className="Assist"
                        onClick={() => recordStats(player, 'assist')}
                    />
                    <ExtraStats
                        setStatName={"Steal"}
                        className="Steal"
                        onClick={() => recordStats(player, 'steal')}
                    />
                    <ExtraStats
                        setStatName={"Defensive Rebound"}
                        className="Defensive Rebound"
                        onClick={() => recordStats(player, 'defensiveRebound')}
                    />
                    <ExtraStats
                        setStatName={"Block"}
                        className="Block"
                        onClick={() => recordStats(player, 'block')}
                    />
                    <ExtraStats
                        setStatName={"Turnover"}
                        className="Turnover"
                        onClick={() => recordStats(player, 'turnover')}
                    />
                    {isESOpen && (
                        <ExtraStatPopup
                            isOpen={isESOpen}
                            className={statName}
                            onClose={handleESClose}
                        />
                    )}
                </div>
                <div className="tempo-container">
                    <TempoButton
                        tempoType="Defensive"
                        className={`TempoButton ${isTiming && tempoType !== 'defensive' ? 'disabled' : ''} ${isTiming && tempoType === 'defensive' ? 'stop' : 'start'}`}
                        isTiming={isTiming && tempoType === 'defensive'}
                        onClick={() => isTiming && tempoType === 'defensive' ? handleStopTempo('defensive') : startTempo('defensive')}
                        disabled={isTiming && tempoType !== 'defensive'}
                    />
                    <TempoButton
                        tempoType="Offensive"
                        className={`TempoButton ${isTiming && tempoType === 'offensive' ? 'stop' : 'start'} ${isTiming && tempoType !== 'offensive' ? 'disabled' : ''}`}
                        isTiming={isTiming && tempoType === 'offensive'}
                        onClick={() => isTiming && tempoType === 'offensive' ? handleStopTempo('offensive') : startTempo('offensive')}
                        disabled={isTiming && tempoType !== 'offensive'}
                    />
                </div>
            </div>
        </div>
    );
}

export default DrillPage;