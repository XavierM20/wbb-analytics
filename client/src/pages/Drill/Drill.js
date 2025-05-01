import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Modal } from 'react-native';
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
import { useNavigate, useLocation} from 'react-router-dom';


function DrillPage() {
    const [seasonData, setSeasonData] = useState([]);
    const [schoolID, setSchoolID] = useState(sessionStorage.getItem("schoolID"));
    const [drillName, setDrillName] = useState('');
    const [drillData, setDrillData] = useState([]);
    
    // TeamA and TeamB state hooks
    const location = useLocation();
    const [teamA, setTeamA] = useState(location.state?.TeamA || []);
    const [teamB, setTeamB] = useState(location.state?.TeamB || []);
    const [allPlayers, setAllPlayers] = useState([]);

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
    const [isPlayerSelectedforShot, setIsPlayerSelectedforShot] = useState(false);
    const [player, setPlayer] = useState(null);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [selectedPlayerForSub, setSelectedPlayerForSub] = useState(null);
    const [isShotPopupOpen, setIsShotPopupOpen] = useState(false);
    const [selectedZone, setSelectedZone] = useState(null);
    const [isESOpen, setIsESOpen] = useState(false);
    const [statName, setStatName] = useState("");
    const [currentPlayer, setCurrentPlayer] = useState(null);
    const currentPlayerRef = useRef(null);
    useEffect(() => {
        currentPlayerRef.current = currentPlayer;
    }, [currentPlayer]);

    // Server URL from environment variables for API requests
    const serverUrl = process.env.REACT_APP_SERVER_URL;

    // Extracting practice and drill IDs from the URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const drillID = urlParams.get('DrillID');
    const practiceID = urlParams.get('PracticeID');

    // State hooks for team scores
    const [teamAScore, setTeamAScore] = useState(0);
    const [teamBScore, setTeamBScore] = useState(0);

    /* Court shot handling */
    const [selectedMode, setSelectedMode] = useState(null);
    const [tempoEventIds, setTempoEventIds] = useState([]);
    const [shotEvents, setShotEvents] = useState([]);

    /* For Styling */
    const [leftWidth, setLeftWidth] = useState(0);
    const [rightWidth, setRightWidth] = useState(0);
    const maxWidth = Math.max(leftWidth, rightWidth);
    const { width: viewportWidth } = Dimensions.get('window');
    const isSmallScreen = viewportWidth < 600; // adjust breakpoint as needed

    const currentDate = new Date();
    const date = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getDate().toString().padStart(2, '0')}`;

    // Fetch players from the server on component mount
    useEffect(() => {
        console.log(teamA);
        console.log(teamB);
    
        const transformedTeamA = teamA.map(player => ({
            id: player._id,
            name: player.playerName,
            number: player.jersey_number
        }));
    
        const transformedTeamB = teamB.map(player => ({
            id: player._id,
            name: player.playerName,
            number: player.jersey_number
        }));
    
        setAllPlayers([...transformedTeamA, ...transformedTeamB]);
    }, [teamA, teamB]);

    useEffect(() => {
        console.log(allPlayers);
        setPlayersOnCourt(allPlayers.splice(0, 5));
    }, [allPlayers]);

    useEffect(() => {
        const fetchSeasonId = async () => {
            try {
                const season = await getSeasonByDate(); // Wait for the function to complete
                setSeasonData(season); // Store the result in state
            } catch (error) {
                console.error("Error fetching season ID:", error);
            }
        };

        const fetchDrillData = async () => {
            try {
                const response = await fetch(`${serverUrl}/api/drills/${drillID}`);
                const data = await response.json();
                console.log('Drill Data:', data);
                setDrillName(data.name);
                setDrillData(data._id);
            } catch (error) {
                console.error('Error fetching drill data:', error);
            }
        }; 

        fetchSeasonId();
        fetchDrillData();
    }, []); // Runs only once when the component mounts

    const getSeasonByDate = async () => {
        const currentDate = new Date();
        const month = currentDate.getMonth() + 1;
        const day = currentDate.getDate();
        const year = currentDate.getFullYear();

        const computedYear = (month < 8 || (month === 8 && day < 2)) ? year - 1 : year + 1;

        const year1 = Math.min(year, computedYear).toString();
        const year2 = Math.max(year, computedYear).toString();

        console.log(year1, year2);

        // Get the current season for this school
        const seasonResponse = await fetch(`${process.env.REACT_APP_SERVER_URL}/api/seasons/endYear/${year2}/${schoolID}`);
        const seasonData = await seasonResponse.json();
        console.log('Season Data:');
        console.log(seasonData);

        // Get the school name from schoolID
        const schoolResponse = await fetch(`${process.env.REACT_APP_SERVER_URL}/api/schools/${schoolID}`);
        const schoolData = await schoolResponse.json();
        console.log('School Data:');
        console.log(schoolData);

        return seasonData;
    };

    // Function to submit tempo
    const submitTempo = async (isOffensive, playersOnCourtIds, tempo) => {
        console.log(isOffensive);
        console.log(`Submitting ${isOffensive} tempo`);
        
        const tempoEvent = {
            gameOrDrill_id: drillID,
            onModel: 'Drill',
            player_ids: playersOnCourtIds,
            tempo_type: isOffensive,
            transition_time: tempo.toFixed(2),
            timestamp: new Date().toISOString()
        };

        // Send the tempo event to the server
        try {
            const response = await fetch(`${serverUrl}/api/tempos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(tempoEvent)
            });

            if (!response.ok) {
                throw new Error('Failed to submit tempo event');
            }

            const data = await response.json();
            console.log('Tempo event submitted:', data);
            return data._id; // Return the ID of the submitted tempo event  
        } catch (error) {
            console.error('Error submitting tempo event:', error);
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
    const handleStopTempo = async (type) => {
        console.log(`Stopping ${tempoType} tempo`);
        setIsTiming(false);
        setRecordedTempo(currentTempo);

        // Determine if tempo is offensive or defensive
        const isOffensive = tempoType;

        // Get the IDs of the players on the court
        const playersOnCourtIds = playersOnCourt.map(player => player.id);

        // Call submitTempo with the correct arguments
        let newTempoID = await submitTempo(isOffensive, playersOnCourtIds, currentTempo);

        // Patch game with new tempoID
        const newTempoEvents = [...tempoEventIds, newTempoID];
        setTempoEventIds(newTempoEvents);

        console.log(newTempoEvents);
      
        // Patch game in database using the locally computed values
        const updatedDrill = {
            practice_id: practiceID,
            name: drillName,
            tempo_events: newTempoEvents,
            shot_events: shotEvents,
        };
      
        await fetch(`${serverUrl}/api/drills/${drillID}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedDrill)
        });
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

    const scaleFactor = 0.65;

    const MAP2 = {
        name: "my-map",
        areas: [
            {
                name: "3",
                shape: "poly",
                coords: [25, 1.5, 26, 20, 29, 40, 105, 40, 105, 1.5].map(n => n * scaleFactor),
                fillColor: "#4f2984",
                preFillColor: "rgba(52, 52, 52, 0.2)",
                fillColor: "rgba(23, 43, 79, .6)",
                strokeColor: "green"
            },
            {
                name: "2",
                shape: "poly",
                coords: [193, 1.5, 193, 40, 270, 40, 273, 20, 275, 1.5].map(n => n * scaleFactor),
                fillColor: "#4f2984",
                preFillColor: "rgba(52, 52, 52, 0.2)",
                fillColor: "rgba(23, 43, 79, .6)",
                strokeColor: "green"
            },
            {
                name: "1",
                shape: "poly",
                coords: [108, 1.5, 108, 102, 190, 102, 190, 1.5].map(n => n * scaleFactor),
                fillColor: "#4f2984",
                preFillColor: "rgba(52, 52, 52, 0.2)",
                fillColor: "rgba(23, 43, 79, .6)",
                strokeColor: "purple"
            },
            {
                name: "5",
                shape: "poly",
                coords: [30, 45, 103, 45, 103, 107, 150, 107, 150, 141, 126, 138, 115, 135, 110, 134, 100, 131, 95, 129, 90, 127, 85, 125, 74, 117, 65, 110, 40, 78, 38, 70].map(n => n * scaleFactor),
                fillColor: "#4f2984",
                preFillColor: "rgba(52, 52, 52, 0.2)",
                fillColor: "rgba(23, 43, 79, .6)",
                strokeColor: "red"
            },
            {
                name: "4",
                shape: "poly",
                // First, transform the coordinates using your custom mapping, then scale them.
                coords: [30, 45, 108, 45, 108, 107, 150, 107, 150, 141, 126, 138, 115, 135, 110, 134, 100, 131, 95, 129, 90, 127, 85, 125, 74, 117, 65, 110, 40, 78, 38, 70]
                    .map((n, i) => (i % 2 === 0 ? 300 - n : n))
                    .map(n => n * scaleFactor),
                fillColor: "#4f2984",
                preFillColor: "rgba(52, 52, 52, 0.2)",
                fillColor: "rgba(23, 43, 79, .6)",
                strokeColor: "red"
            },
            {
                name: "8",
                shape: "poly",
                coords: [80, 127, 0, 250, 300, 250, 220, 127, 205, 134, 180, 141, 150, 145, 122, 142, 98, 135].map(n => n * scaleFactor),
                fillColor: "#4f2984",
                preFillColor: "rgba(52, 52, 52, 0.2)",
                fillColor: "rgba(23, 43, 79, .6)",
                strokeColor: "blue"
            },
            {
                name: "7",
                shape: "poly",
                coords: [0, 1.5, 20, 1.5, 23, 34, 35, 75, 40, 85, 45, 92, 50, 99, 55, 105, 60, 110, 65, 116, 70, 120, 79, 127, 0, 250].map(n => n * scaleFactor),
                fillColor: "#4f2984",
                preFillColor: "rgba(52, 52, 52, 0.2)",
                fillColor: "rgba(23, 43, 79, .6)",
                strokeColor: "blue"
            },
            {
                name: "6",
                shape: "poly",
                coords: [300, 1.5, 278, 1.5, 275, 34, 265, 75, 260, 85, 255, 92, 250, 99, 245, 105, 240, 110, 235, 116, 230, 120, 221, 127, 300, 250].map(n => n * scaleFactor),
                fillColor: "#4f2984",
                preFillColor: "rgba(52, 52, 52, 0.2)",
                fillColor: "rgba(23, 43, 79, .6)",
                strokeColor: "blue"
            }
        ]
    };

    const updatedMap = {
        ...MAP2,
        areas: MAP2.areas.map(area =>
        selectedZone && area.name === selectedZone.name
            ? { ...area, preFillColor: "rgba(23, 43, 79, .5)" } // Highlight color
            : { ...area, preFillColor: "rgba(52, 52, 52, 0.2)" } // Default color
        ),
    };

    const handleCourtOverlayClick = () => {
        //setIsShotPopupOpen(false);
        setIsPlayerSelectedforShot(false);
        setIsShotPopupOpen(false);
    };

    const courtClicked = (area) => {
        console.log(`Zone ${area} clicked for shot`);
        console.log(area);
        setSelectedZone(area);
        setIsShotPopupOpen(true);
    }

    const handleShotPopupClose = () => {
        setIsShotPopupOpen(false);
        setIsPlayerSelectedforShot(false);
    }

    const onPlayerSelectForSub = (player) => {
        setSelectedPlayerForSub(player); // Set the player selected for substitution
        setIsPopupOpen(true); // Open the substitution popup
    };

    const handleESClose = () => {
        setIsESOpen(false);
    }

    const recordStats = async (player, stat) => {
        console.log(`Recording ${stat} for player ${player.name}`);
        
        const statsResponse = await fetch(`${serverUrl}/api/stats/${stat}/${drillID}/${player.id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
        })

        const response = await statsResponse.json();
        console.log('Stats recorded:', response);
    }

    const updateTeamAScore = (points) => {
        setTeamAScore(prevScore => prevScore + points);

        // Add tempo Logic

        /*
        // Patch the game in the database with the new score
        const updatedScore = {
            season_id: seasonData._id,
            date: date,
            opponent: opponentTeam,
            location: location,
            tempo_events: tempoEventIds,
            shot_events: shotEvents,
            score: {
                team: (points+myScore),
                opponent: opponentScore,
            },
            team_logo: imageID,
        };

        fetch(`${serverUrl}/api/games/${gameData}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedScore)
        })
        */
    }

    const updateTeamBScore = (points) => {
        setTeamBScore(prevScore => prevScore + points);

        // Add tempo Logic

        /*
        // Patch the game in the database with the new score
        const updatedScore = {
            season_id: seasonData._id,
            date: date,
            opponent: opponentTeam,
            location: location,
            tempo_events: tempoEventIds,
            shot_events: shotEvents,
            score: {
                team: (points+myScore),
                opponent: opponentScore,
            },
            team_logo: imageID,
        };

        fetch(`${serverUrl}/api/games/${gameData}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedScore)
        })
        */
    }

    const handleShotEvent = async (made, zone, shotClockTime, ) => {
        const shotEvent = {
            gameOrDrill_id: drillID,
            onModel: 'Drill',
            player_id: currentPlayerRef.current.id,
            made: made,
            zone: zone,
            shot_clock_time: shotClockTime,
            timestamp: new Date().toISOString()
        };
        
        let shotResponse = await fetch(`${serverUrl}/api/shots`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(shotEvent)
        });
      
        // Parse the response (assuming the response returns the created shot event data)
        const shotData = await shotResponse.json();

        return shotData._id;
    }

    const onPlayerSelectForShot = (player) => {
        // If the currently selected player is the same as the clicked player, deselect
        if (currentPlayer && currentPlayer.id === player.id) {
            console.log('Deselecting player:');
            console.log(player);
            setIsPlayerSelectedforShot(false);
            setCurrentPlayer(null);
        } else {
            console.log('Player selected for shot:');
            console.log(player);
            setIsPlayerSelectedforShot(true);
            setCurrentPlayer(player);
        }
    };

    const handleMadeShot = async () => {
        // Determine shot points based on zone name
        const shotPoints = (selectedZone.name == 6 || selectedZone.name == 7 || selectedZone.name == 8) ? 3 : 2;
        console.log(currentPlayerRef.current);
        console.log(`${shotPoints} point shot made by ${currentPlayerRef.current.name}`);
        let newScore;

        if(selectedMode == 'Team A') {
            newScore = teamAScore + shotPoints;
            setTeamAScore(newScore);
        } else if(selectedMode == 'Team B') {
            newScore = teamBScore + shotPoints;
            setTeamBScore(newScore);
        }
        
        setIsShotPopupOpen(false);
        setIsTiming(false);
        console.log(`Tempo recorded: ${currentTempo.toFixed(2)} seconds`);
    
        // Determine shot clock time based on current tempo
        let shotClockTime = null;
        if (currentTempo.toFixed(2) <= 20) {
            shotClockTime = 'first_third';
        } else if (currentTempo.toFixed(2) <= 40) {
            shotClockTime = 'second_third';
        } else {
            shotClockTime = 'final_third';
        }

        const currentTime = new Date().toISOString()

        // Submit the shot event to the server
        const shotData = await handleShotEvent(true, selectedZone.name, shotClockTime);

        // Update shotEvents locally with the new shot event
        const newShotEvents = [...shotEvents, shotData];
        
        setShotEvents(newShotEvents);

        // Submit the temp event to the database
        const tempoData = await submitTempo('offensive', playersOnCourt.map(player => player.id), currentTempo);

        // Update tempoEvents locally with the new tempo event
        const newTempoEvents = [...tempoEventIds, tempoData];
        setTempoEventIds(newTempoEvents);

        console.log(newTempoEvents);
    
        // Patch game in database using the locally computed values
        const updatedDrill = {
            practice_id: practiceID,
            name: drillName,
            tempo_events: newTempoEvents,
            shot_events: newShotEvents,
        };
    
        await fetch(`${serverUrl}/api/drills/${drillID}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedDrill)
        });
    };

    const handleMissedShot = async () => {
        setIsShotPopupOpen(false);

        // Find the shot clock time based on the current tempo
        var shotClockTime = null;
        if(currentTempo.toFixed(2) <= 20) {
            shotClockTime = 'first_third';
        } else if (currentTempo.toFixed(2) <= 40) {
            shotClockTime = 'second_third';
        } else {
            shotClockTime = 'final_third';
        }
        
        // Submit the shot event to the server
        const shotData = await handleShotEvent(false, selectedZone.name, shotClockTime);

        // Update shotEvents locally with the new shot event
        const newShotEvents = [...shotEvents, shotData];

        // Submit the temp event to the database
        const tempoData = await submitTempo('offensive', playersOnCourt.map(player => player.id), currentTempo);

        // Update tempoEvents locally with the new tempo event
        const newTempoEvents = [...tempoEventIds, tempoData];
        setTempoEventIds(newTempoEvents);

        // Patch game in database using the locally computed values
        const updatedDrill = {
            practice_id: practiceID,
            name: drillName,
            tempo_events: newTempoEvents,
            shot_events: newShotEvents,
        };
    
        await fetch(`${serverUrl}/api/drills/${drillID}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedDrill)
        });
    };

    return (
        <div className="background-container">
            <button className='btn-home top-right-button' onClick={() => navigate('/homepage')}>Home</button>
            <div className="drill-container">
                <View style={styles.outerContainer}>
                    <View style={styles.scoreboardWrapper}>
                        {/* Left Group */}
                        <View style={[styles.leftGroup, { minWidth: maxWidth || undefined }]} onLayout={(e) => setLeftWidth(e.nativeEvent.layout.width)}>
                            <Text style={styles.teamText}>Team A</Text>
                            <View style={styles.scoreBox}>
                                <Text style={styles.scoreText}>{teamAScore}</Text>
                            </View>
                        </View>

                        {/* Center Colon */}
                        <Text style={styles.colonText}>:</Text>

                        {/* Right Group */}
                        <View
                        style={[styles.rightGroup, { minWidth: maxWidth || undefined }]}
                        onLayout={(e) => setRightWidth(e.nativeEvent.layout.width)}
                        >
                        <View style={styles.scoreBox}>
                            <Text style={styles.scoreText}>{teamBScore}</Text>
                        </View>
                            <Text style={styles.teamText}>Team B</Text>
                        </View>
                    </View>
                </View>
                <div className="player-and-court-container">
                    <View style={styles.playerContainer}>
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
                    </View>
                    <View style={styles.courtContainer}>
                        {isSmallScreen ? (
                            <>
                                {/* Top group: Your Team */}
                                <View style={styles.pointsContainer}>
                                    <TouchableOpacity
                                        style={[
                                            styles.courtButton,
                                            selectedMode === 'Team A' && styles.selectedButton,
                                        ]}
                                        onPress={() => setSelectedMode('Team A')}
                                    >
                                        <Text style={styles.buttonText}>Team A</Text>
                                    </TouchableOpacity>
                                    <View style={styles.pointsRow}>
                                        <TouchableOpacity style={styles.pointsButton} onPress={() => updateTeamAScore(3)}>
                                            <Text>+3</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.pointsButton} onPress={() => updateTeamAScore(2)}>
                                            <Text>+2</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.pointsButton} onPress={() => updateTeamAScore(1)}>
                                            <Text>+1</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.pointsButton} onPress={() => updateTeamAScore(-1)}>
                                            <Text>-1</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Court */}
                                <View style={styles.courtWrapper}>
                                    <ImageMapper
                                        src={basketballCourtVector}
                                        map={updatedMap}
                                        width={300 * scaleFactor}
                                        height={245 * scaleFactor}
                                        lineWidth={5}
                                        strokeColor="white"
                                        onClick={courtClicked}
                                    />
                                </View>

                                {/* Bottom group: Opponent */}
                                <View style={styles.pointsContainer}>
                                    <TouchableOpacity
                                        style={[
                                            styles.courtButton,
                                            selectedMode === 'Team B' && styles.selectedButton,
                                        ]}
                                        onPress={() => setSelectedMode('Team B')}
                                    >
                                        <Text style={styles.buttonText}>Team B</Text>
                                    </TouchableOpacity>
                                    <View style={styles.pointsRow}>
                                        <TouchableOpacity style={styles.pointsButton} onPress={() => updateTeamBScore(3)}>
                                            <Text>+3</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.pointsButton} onPress={() => updateTeamBScore(2)}>
                                            <Text>+2</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.pointsButton} onPress={() => updateTeamBScore(1)}>
                                            <Text>+1</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.pointsButton} onPress={() => updateTeamBScore(-1)}>
                                            <Text>-1</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </>
                        ) : (
                            // Original layout for larger screens:
                            <View style={styles.horizontalContainer}>
                                {/* Left Buttons Column */}
                                <View style={styles.buttonColumn}>
                                    <TouchableOpacity
                                        style={[
                                            styles.courtButton,
                                            selectedMode === 'Team A' && styles.selectedButton,
                                        ]}
                                        onPress={() => setSelectedMode('Team A')}
                                    >
                                        <Text style={styles.buttonText}>Team A</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.pointsButton} onPress={() => updateTeamAScore(3)}>
                                        <Text>+3</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.pointsButton} onPress={() => updateTeamAScore(2)}>
                                        <Text>+2</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.pointsButton} onPress={() => updateTeamAScore(1)}>
                                        <Text>+1</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.pointsButton} onPress={() => updateTeamAScore(-1)}>
                                        <Text>-1</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Court */}
                                <View style={styles.courtWrapper}>
                                    <ImageMapper
                                        src={basketballCourtVector}
                                        map={updatedMap}
                                        width={300 * scaleFactor}
                                        height={245 * scaleFactor}
                                        lineWidth={5}
                                        strokeColor="white"
                                        onClick={courtClicked}
                                    />
                                </View>

                                {/* Right Buttons Column */}
                                <View style={styles.buttonColumn}>
                                    <TouchableOpacity
                                        style={[
                                            styles.courtButton,
                                            selectedMode === 'Team B' && styles.selectedButton,
                                        ]}
                                        onPress={() => setSelectedMode('Team B')}
                                    >
                                        <Text style={styles.buttonText}>Team B</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.pointsButton} onPress={() => updateTeamBScore(3)}>
                                        <Text>+3</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.pointsButton} onPress={() => updateTeamBScore(2)}>
                                        <Text>+2</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.pointsButton} onPress={() => updateTeamBScore(1)}>
                                        <Text>+1</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.pointsButton} onPress={() => updateTeamBScore(-1)}>
                                        <Text>-1</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>
                </div>
                <div className="extra-stats-container">
                    <ExtraStats
                        setStatName={"Offensive Rebound"}
                        className="Offensive Rebound"
                        onPress={() => recordStats(player, 'offensiveRebound')}
                    />
                    <ExtraStats
                        setStatName={"Assist"}
                        className="Assist"
                        onPress={() => recordStats(player, 'assist')}
                    />
                    <ExtraStats
                        setStatName={"Steal"}
                        className="Steal"
                        onPress={() => recordStats(player, 'steal')}
                    />
                    <ExtraStats
                        setStatName={"Defensive Rebound"}
                        className="Defensive Rebound"
                        onPress={() => recordStats(player, 'defensiveRebound')}
                    />
                    <ExtraStats
                        setStatName={"Block"}
                        className="Block"
                        onPress={() => recordStats(player, 'block')}
                    />
                    <ExtraStats
                        setStatName={"Turnover"}
                        className="Turnover"
                        onPress={() => recordStats(player, 'turnover')}
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
                        tempoType="Offensive"
                        className={`TempoButton ${isTiming && tempoType === 'offensive' ? 'stop' : 'start'} ${isTiming && tempoType !== 'offensive' ? 'disabled' : ''}`}
                        isTiming={isTiming && tempoType === 'offensive'}
                        onPress={() => isTiming && tempoType === 'offensive' ? handleStopTempo('offensive') : startTempo('offensive')}
                        disabled={isTiming && tempoType !== 'offensive'}
                    />
                    <TempoTimer
                        isTiming={isTiming}
                        resetTimer={resetTimer}
                        setResetTimer={setResetTimer}
                        currentTime={currentTempo}
                        setCurrentTime={setCurrentTempo}
                    />
                    <TempoButton
                        tempoType="Defensive"
                        className={`TempoButton ${isTiming && tempoType !== 'defensive' ? 'disabled' : ''} ${isTiming && tempoType === 'defensive' ? 'stop' : 'start'}`}
                        isTiming={isTiming && tempoType === 'defensive'}
                        onPress={() => isTiming && tempoType === 'defensive' ? handleStopTempo('defensive') : startTempo('defensive')}
                        disabled={isTiming && tempoType !== 'defensive'}
                    />
                </div>
                {/* Shot Outcome Popup */}
                {isShotPopupOpen && (
                    <Modal
                        transparent={true}
                        animationType="fade"
                        visible={isShotPopupOpen}
                        onRequestClose={() => setIsShotPopupOpen(false)}
                    >
                        <View style={styles.overlay}>
                            <View style={styles.popup}>
                                {currentPlayer ? (
                                    <>
                                        {/* Row with Made and Missed buttons */}
                                        <View style={styles.buttonRow}>
                                            <TouchableOpacity style={styles.madeButton} onPress={handleMadeShot}>
                                                <Text style={styles.buttonText}>Made</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity style={styles.missedButton} onPress={handleMissedShot}>
                                                <Text style={styles.buttonText}>Missed</Text>
                                            </TouchableOpacity>
                                        </View>
                                        {/* Separate row for Cancel button */}
                                        <View style={styles.cancelRow}>
                                            <TouchableOpacity style={styles.cancelButton} onPress={() => setIsShotPopupOpen(false)}>
                                                <Text style={styles.buttonText}>Cancel</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </>
                                ) : (
                                    <View style={styles.exceptionText}>
                                        <Text style={styles.buttonText}>Select a player to record a shot.</Text>
                                        <TouchableOpacity style={styles.cancelButton} onPress={() => setIsShotPopupOpen(false)}>
                                            <Text style={styles.buttonText}>Cancel</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        </View>
                    </Modal>
                )}
            </div>
        </div>
    );
}

const styles = StyleSheet.create({
    /*
        Styles for the team names/scoreboard
    */
    outerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scoreboardWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(23, 43, 79, .5)',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
    },
    leftGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    rightGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    colonText: {
        fontSize: 36,
        fontWeight: 'bold',
        color: 'white',
        marginHorizontal: 10,
    },
    teamText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        marginHorizontal: 5,
    },
    scoreBox: {
        borderWidth: 2,
        borderColor: 'yellow',
        borderRadius: 10,
        paddingVertical: 5,
        paddingHorizontal: 10,
        backgroundColor: 'rgba(200, 157, 70, .8)',
        marginHorizontal: 5,
    },
    scoreText: {
        fontSize: 36,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
    },

    /*
        Styles for the player and court area
    */
    topContainer: {
        padding: '1%',
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    // New style for small screens: switch to vertical layout.
    topContainerSmall: {
        flexDirection: 'column',
    },
    playerContainer: {
        backgroundColor: 'rgba(23, 43, 79, .5)',
        borderRadius: 8,
        //padding: '4%',
        color: 'white',
        //width: 'calc(30%)',
        flex: 1,
        marginRight: '5%',
        justifyContent: 'center',
    },
    playerContainerSmall: {
        marginRight: 0,
        marginBottom: 20,
    },
    courtContainer: {
        backgroundColor: 'rgba(23, 43, 79, .5)',
        borderRadius: 8,
        //padding: '4%',
        color: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        //width: 'calc(20vw)',
        flex: 1,
        //padding: '1%',
        zIndex: 1,
    },
    horizontalContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',        // Allow wrap
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 20,
    },
    horizontalContainerSmall: {
        flexDirection: 'column',
    },
    buttonColumn: {
        // Each side’s button set is a column
        alignItems: 'center',
        marginHorizontal: 10,          // Some horizontal space between the columns and the court
    },
    courtWrapper: {
        marginHorizontal: 20,          // More space around the court if desired
    },
    courtButton: {
        // Remove width/height
        // width: 100,
        // height: 30,
        borderRadius: 8,
        backgroundColor: 'rgba(200, 157, 70, .8)',
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 5,
        paddingHorizontal: 12, // Add horizontal padding
        paddingVertical: 8,    // Add vertical padding
    },
    selectedButton: {
        backgroundColor: '#ffd700',
    },    
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    pointsButton: {
        // Remove width/height
        // width: 40,
        // height: 30,
        borderRadius: 8,
        backgroundColor: 'rgba(200, 157, 70, .8)',
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 5,
        paddingHorizontal: 8,
        paddingVertical: 6,
        marginHorizontal: 5,
    },
    pointsRow: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        width: '100%',
        marginVertical: 10,
    },
    /* Shot Pop Up Styling */
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent overlay
        justifyContent: 'center',
        alignItems: 'center',
    },
    popup: {
        backgroundColor: 'transparent',
        width: '90%',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    madeButton: {
        flex: 1,
        width: 100,       // Fixed width; adjust according to your layout
        height: 100,       // Fixed height for a larger tap area
        marginHorizontal: 50,
        backgroundColor: '#28a745',
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    missedButton: {
        flex: 1,
        width: 100,       // Fixed width; adjust according to your layout
        height: 100,       // Fixed height for a larger tap area
        marginHorizontal: 50,
        backgroundColor: '#dc3545',
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelRow: {
        marginTop: 20,       // adds space between the two rows
        alignItems: 'center',
    },
    cancelButton: {
        width: 200,       // Fixed width for the cancel button
        height: 60,       // Fixed height for consistency
        marginTop: 20,    // separates it from the row above
        backgroundColor: '#6c757d',  // red, often used for cancel actions
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    exceptionText: {
        justifyContent: 'center',
        alignItems: 'center',
    },
})

export default DrillPage;