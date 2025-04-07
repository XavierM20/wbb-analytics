import { useNavigate } from 'react-router-dom';
import React, { useRef, useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, Dimensions, Image, TouchableOpacity, Touchable, Modal } from 'react-native';
import styles from './DrillStyle.js';
import ImageMapper from "react-img-mapper";
import basketballCourtVector from '../Drill/components/basketball-court-vector.jpg';
import PlayerList from './components/PlayerList';
import SubstitutionPopup from './components/SubstitutionPopup';
import ExtraStats from './components/ExtraStats';
import TempoButton from './components/TempoButton';
import TempoTimer from './components/TempoTimer';
import CustomAlert from './components/customAlert';
import './Drill.css';

const Drill = () => {
    const [alertVisible, setAlertVisible] = useState(false);
    const [drillData, setDrillData] = useState('');
    const [location, setLocation] = useState('');
    const [myScore, setMyScore] = useState(0);
    const [opponentTeam, setOpponentTeam] = useState('');
    const [opponentScore, setOpponentScore] = useState(0);
    const [submitClicked, setSubmitClicked] = useState(false);
    const [seasonData, setSeasonData] = useState([]);    
    const [newDrillOverlay, setNewDrillOverlay] = useState(false);
    const [tempLocation, setTempLocation] = useState('');
    const [tempoEventIds, setTempoEventIds] = useState([]);
    const [shotEvents, setShotEvents] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [imageID, setImageID] = useState('');

    /* Player Selection  */
    const [playersOnCourt, setPlayersOnCourt] = useState([]);
    const [allPlayers, setAllPlayers] = useState([]);
    const [isPlayerSelectedforShot, setIsPlayerSelectedforShot] = useState(false);
    const [currentPlayer, setCurrentPlayer] = useState(null);
    const currentPlayerRef = useRef(null);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [selectedPlayerForSub, setSelectedPlayerForSub] = useState(null);
    const [isESOpen, setIsESOpen] = useState(false);
    const [statName, setStatName] = useState("");
    
    /* Court shot handling */
    const [selectedZone, setSelectedZone] = useState(null);
    const [isShotPopupOpen, setIsShotPopupOpen] = useState(false);
    const [selectedMode, setSelectedMode] = useState(null);

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

    /* For Styling */
    const [leftWidth, setLeftWidth] = useState(0);
    const [rightWidth, setRightWidth] = useState(0);
    const maxWidth = Math.max(leftWidth, rightWidth);
    const { width: viewportWidth } = Dimensions.get('window');
    const isSmallScreen = viewportWidth < 600; // adjust breakpoint as needed

    const navigate = useNavigate();
    const serverUrl = process.env.REACT_APP_SERVER_URL;
    
    const currentDate = new Date();
    const date = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getDate().toString().padStart(2, '0')}`;

    // Gets SeasonID and stores it for easier use
    useEffect(() => {
        const fetchSeasonId = async () => {
            try {
                const season = await getSeasonByDate(); // Wait for the function to complete
                setSeasonData(season); // Store the result in state
            } catch (error) {
                console.error("Error fetching season ID:", error);
            }
        };

        fetchSeasonId();
    }, []); // Runs only once when the component mounts

    const handleNavigation = () => {
        if (drillData) {
            setAlertVisible(true);
        } else {
            navigate('/homepage');
        }
    }

    const handleConfirm = () => {
        // Save the drill data to the database (patch)

        // Return to the homepage
        navigate('/homepage');
    }

    const handleCancel = () => {
        setAlertVisible(false);
    }
    
    const handleHome = () => {
        navigate('/homepage');
    }

    const createDrill = async () => {
        let image_id = await uploadImage();
        console.log('Image ID:', imageID);

        const drill = {
            season_id: seasonData._id,
            date: date,
            opponent: opponentTeam,
            location: location,
            score: {
                team: 0,
                opponent: 0,
            },
            team_logo: image_id
        };
    
        try {
            const response = await fetch(`${serverUrl}/api/drills`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(drill)
            });
    
            if (!response.ok) {
                throw new Error('Failed to create drill. Please try again.');
            }

            const data = await response.json();
            setDrillData(data._id);
            
            // For each player, post to stats collection
            for (let i = 0; i < allPlayers.length; i++) {
                const player = allPlayers[i];
                const stats = {
                    drillOrDrill_id: data._id,
                    onModel: 'Drill',
                    player_id: player.id,
                    offensive_rebounds: 0,
                    defensive_rebounds: 0,
                    assists: 0,
                    steals: 0,
                    blocks: 0,
                    turnovers: 0, 
                };

                await fetch(`${serverUrl}/api/stats`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(stats)
                });
            }
        } catch (error) {
            console.error('Error with drill data:', error.message);
        }
    };

    const uploadImage = async() => {
        if (!selectedFile) {
            console.log('No file selected');
            return null;
        }

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const response = await fetch(`${serverUrl}/api/drills/uploadLogo`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            console.log('Image uploaded:', data.id);
            setImageID(data.id);
            return data.id;
        } catch (error) {
            console.error('Error uploading image:', error);
            return null;
        }
    }

    const handleLocationClick = (location) => {
        setTempLocation(location);
    };

    const handleInputSubmission = () => {
        if (opponentTeamValue !== '' && tempLocation !== '') {
            setOpponentTeam(opponentTeamValue);
            setLocation(tempLocation);
            setSubmitClicked(true);
            setNewDrillOverlay(false);
            
        } else {
            alert('Please enter both opponent name and location.');
        }
    };

    const handleSelectDrill = async (drill) => {
        try {
            const response = await fetch(`${serverUrl}/api/drills/id/${drill._id}`);

            if (!response.ok) {
                throw new Error('Failed to fetch drill details');
            }

            const drillDetails = await response.json();
            console.log('Drill details:');
            console.log(drillDetails);

            const teamLogo = await fetch(`${serverUrl}/api/drills/image/${drillDetails.team_logo}`);
            console.log(teamLogo);
            setDrillData(drillDetails._id);
            setOpponentTeam(drillDetails.opponent);
            setLocation(drillDetails.location);
            setTempoEventIds(drillDetails.tempo_events || []);
            setShotEvents(drillDetails.shot_events || []);
            setFilePreview(teamLogo.url);
            setImageID(drillDetails.team_logo);
            setMyScore(drillDetails.score.team)
            setOpponentScore(drillDetails.score.opponent)

        } catch (error) {
            console.error('Error fetching Drill details:', error);
        }
    };

    const getSeasonByDate = async () => {
        const currentDate = new Date();
        const month = currentDate.getMonth() + 1;
        const day = currentDate.getDate();
        const year = currentDate.getFullYear();

        const computedYear = (month < 8 || (month === 8 && day < 2)) ? year - 1 : year + 1;

        const year1 = Math.min(year, computedYear).toString();
        const year2 = Math.max(year, computedYear).toString();

        console.log(year1, year2);

        return seasonData;
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
                strokeColor: "green"
            },
            {
                name: "2",
                shape: "poly",
                coords: [193, 1.5, 193, 40, 270, 40, 273, 20, 275, 1.5].map(n => n * scaleFactor),
                fillColor: "#4f2984",
                preFillColor: "rgba(52, 52, 52, 0.2)",
                strokeColor: "green"
            },
            {
                name: "1",
                shape: "poly",
                coords: [108, 1.5, 108, 102, 190, 102, 190, 1.5].map(n => n * scaleFactor),
                fillColor: "#4f2984",
                preFillColor: "rgba(52, 52, 52, 0.2)",
                strokeColor: "purple"
            },
            {
                name: "5",
                shape: "poly",
                coords: [30, 45, 103, 45, 103, 107, 150, 107, 150, 141, 126, 138, 115, 135, 110, 134, 100, 131, 95, 129, 90, 127, 85, 125, 74, 117, 65, 110, 40, 78, 38, 70].map(n => n * scaleFactor),
                fillColor: "#4f2984",
                preFillColor: "rgba(52, 52, 52, 0.2)",
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
                strokeColor: "red"
            },
            {
                name: "8",
                shape: "poly",
                coords: [80, 127, 0, 250, 300, 250, 220, 127, 205, 134, 180, 141, 150, 145, 122, 142, 98, 135].map(n => n * scaleFactor),
                fillColor: "#4f2984",
                preFillColor: "rgba(52, 52, 52, 0.2)",
                strokeColor: "blue"
            },
            {
                name: "7",
                shape: "poly",
                coords: [0, 1.5, 20, 1.5, 23, 34, 35, 75, 40, 85, 45, 92, 50, 99, 55, 105, 60, 110, 65, 116, 70, 120, 79, 127, 0, 250].map(n => n * scaleFactor),
                fillColor: "#4f2984",
                preFillColor: "rgba(52, 52, 52, 0.2)",
                strokeColor: "blue"
            },
            {
                name: "6",
                shape: "poly",
                coords: [300, 1.5, 278, 1.5, 275, 34, 265, 75, 260, 85, 255, 92, 250, 99, 245, 105, 240, 110, 235, 116, 230, 120, 221, 127, 300, 250].map(n => n * scaleFactor),
                fillColor: "#4f2984",
                preFillColor: "rgba(52, 52, 52, 0.2)",
                strokeColor: "blue"
                }
        ]
    };

    /* Court Functions */
    const courtClicked = (area) => {
        setSelectedZone(area);
        setIsShotPopupOpen(true);
    }

    // Still need to handle tempos
    const handleMadeShot = async () => {
        // Determine shot points based on zone name
        const shotPoints = (selectedZone.name == 6 || selectedZone.name == 7 || selectedZone.name == 8) ? 3 : 2;
        console.log(`${shotPoints} point shot made by ${currentPlayerRef.current.name}`);
        
        // Calculate the new score locally
        const newScore = myScore + shotPoints;
        setMyScore(newScore);
        
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
        const tempoData = await submitTempo((tempoType === 'offensive' ? 'defensive' : 'offensive'), playersOnCourt.map(player => player.id), currentTempo);

        // Update tempoEvents locally with the new tempo event
        const newTempoEvents = [...tempoEventIds, tempoData];
        setTempoEventIds(newTempoEvents);

        console.log(newTempoEvents);
      
        // Patch drill in database using the locally computed values
        const updatedScore = {
          season_id: seasonData._id,
          date: date,
          opponent: opponentTeam,
          location: location,
          tempo_events: newTempoEvents,
          shot_events: newShotEvents, // Use the updated array
          score: {
            team: newScore, // Use the new score calculated locally
            opponent: opponentScore
          },
          team_logo: imageID,
        };
      
        await fetch(`${serverUrl}/api/drills/${drillData}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updatedScore)
        });
      };      
      
    const handleMissedShot = async () => {
        console.log(`Shot missed by ${currentPlayerRef.current.name}`);
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
        handleShotEvent(false, selectedZone.name, shotClockTime);
    };

    // Function to handle submission of shotEvents
    // Takes made: boolean, zone: string, shotClockTime: string
    const handleShotEvent = async (made, zone, shotClockTime, ) => {
        const shotEvent = {
            drillOrDrill_id: drillData,
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

    // Create a new map object with the selected area highlighted.
    const updatedMap = {
        ...MAP2,
        areas: MAP2.areas.map(area =>
        selectedZone && area.name === selectedZone.name
            ? { ...area, preFillColor: "rgba(255, 0, 0, 0.5)" } // Highlight color
            : { ...area, preFillColor: "rgba(52, 52, 52, 0.2)" } // Default color
        ),
    };

    // Function that adds points to the team score
    const myTeamScore = (points) => {
        setMyScore(prevScore => prevScore + points);

        // Patch the drill in the database with the new score
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

        fetch(`${serverUrl}/api/drills/${drillData}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedScore)
        })
    }

    // Function that adds points to the team score
    const opposingTeamScore = (points) => {
        setOpponentScore(prevScore => prevScore + points);
        
        // Patch the drill in the database with the new score
        const updatedScore = {
            season_id: seasonData._id,
            date: date,
            opponent: opponentTeam,
            location: location,
            tempo_events: tempoEventIds,
            shot_events: shotEvents,
            score: {
                team: myScore,
                opponent: (points+opponentScore),
            },
            team_logo: imageID,
        };

        fetch(`${serverUrl}/api/drills/${drillData}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedScore)
        })
    }

    /* 
        End Court Functions 
    */

    /* 
        Player Selection Functions 
    */

    // Retrieve players from database
    useEffect(() => {
        // Guard clause to ensure seasonData is valid
        if (!seasonData || !seasonData._id) return;
      
        fetch(`${serverUrl}/api/players/bySeason/${seasonData._id}`)
          .then((response) => response.json())
          .then((data) => {
            const playersData = data.map((player) => ({
              id: player._id,
              name: player.name,
              number: player.jersey_number,
            }));
            setAllPlayers(playersData);
            setPlayersOnCourt(playersData.slice(0, 5));
        });
    }, [serverUrl, seasonData]);

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

    useEffect(() => {
        currentPlayerRef.current = currentPlayer;
    }, [currentPlayer]);

    const onPlayerSelectForSub = (player) => {
        setSelectedPlayerForSub(player); // Set the player selected for substitution
        setIsPopupOpen(true); // Open the substitution popup
    };

    const handleOverlayClick = () => {
        setIsPopupOpen(false);
        setIsPlayerSelectedforShot(false);
    };

    const handleSubstitute = (newPlayer) => {
        console.log(`Substituting player ${selectedPlayerForSub.number} with ${newPlayer.number}`);
        setPlayersOnCourt(playersOnCourt.map(p =>
            p.number === selectedPlayerForSub.number ? newPlayer : p
        ));
        setIsPopupOpen(false);
        setIsPlayerSelectedforShot(false);
    };

    /* 
        End Player Selections Functions 
    */

    /*
        Stats Functions
    */

    // Function that patches (updates) one stat by one for a player in the database
    // uses stat name for the route and sends the player_id and drillOrDrill_id parameters
    const recordStats = async (player, stat) => {
        console.log(`Recording ${stat} for player ${player.name}`);
        
        const statsResponse = await fetch(`${serverUrl}/api/stats/${stat}/${drillData}/${player.id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
        })

        const response = await statsResponse.json();
        console.log('Stats recorded:', response);
    }

    /*
        End Stats functions
    */

    /*
        Tempo Functions
    */

    const handleStopTempo = async (type) => {
        console.log(`Stopping ${tempoType} tempo`);
        setIsTiming(false);
        setRecordedTempo(currentTempo);

        // Determine if tempo is offensive or defensive
        const isOffensive = (tempoType === 'offensive') ? true : false;

        // Get the IDs of the players on the court
        const playersOnCourtIds = playersOnCourt.map(player => player.id);

        // Call submitTempo with the correct arguments
        let newTempoID = await submitTempo(isOffensive, playersOnCourtIds, currentTempo);
    };

    // Add functionality for submit tempo
    const submitTempo = async (isOffensive, playersOnCourtIds, tempo) => {
        console.log(`Submitting ${isOffensive ? 'offensive' : 'defensive'} tempo`);
        
        const tempoEvent = {
            drillOrDrill_id: drillData,
            onModel: 'Drill',
            player_ids: playersOnCourtIds,
            tempo_type: isOffensive ? 'offensive' : 'defensive',
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


    /*
        End Tempo Functions
    */

    return (
        <>
            <div className='main'>
                <button className='btn-home top-right-button' onClick={handleNavigation}>Home</button>
                <CustomAlert
                    visible={alertVisible}
                    title="Save Drill?"
                    message="Do you want save the drill first?"
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                    onGoHome={handleHome}
                />
                <View style={styles.outerContainer}>
                    <View style={styles.scoreboardWrapper}>
                        {/* Left Group */}
                        <View style={[styles.leftGroup, { minWidth: maxWidth || undefined }]} onLayout={(e) => setLeftWidth(e.nativeEvent.layout.width)}>
                            <Text style={styles.teamText}>{myTeam}</Text>
                            <View style={styles.scoreBox}>
                                <Text style={styles.scoreText}>{myScore}</Text>
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
                            <Text style={styles.scoreText}>{opponentScore}</Text>
                        </View>
                            <Text style={styles.teamText}>{opponentTeam}</Text>
                            {filePreview && (
                                <Image 
                                    source={{ uri: filePreview }}  
                                    style={styles.teamLogo} 
                                    onError={(error) => console.error("Image Load Error:", error.nativeEvent)}
                                />
                            )}
                        </View>
                    </View>
                </View>
                <View style={[styles.topContainer, isSmallScreen && styles.topContainerSmall]}>
                    <View style={[styles.playerContainer, isSmallScreen && styles.playerContainerSmall]}>
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
                                            selectedMode === 'offense' && styles.selectedButton,
                                        ]}
                                        onPress={() => setSelectedMode('offense')}
                                    >
                                        <Text style={styles.buttonText}>Your Team</Text>
                                    </TouchableOpacity>
                                    <View style={styles.pointsRow}>
                                        <TouchableOpacity style={styles.pointsButton} onPress={() => myTeamScore(3)}>
                                            <Text>+3</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.pointsButton} onPress={() => myTeamScore(2)}>
                                            <Text>+2</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.pointsButton} onPress={() => myTeamScore(1)}>
                                            <Text>+1</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.pointsButton} onPress={() => myTeamScore(-1)}>
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
                                            selectedMode === 'defense' && styles.selectedButton,
                                        ]}
                                        onPress={() => setSelectedMode('defense')}
                                    >
                                        <Text style={styles.buttonText}>Opponent</Text>
                                    </TouchableOpacity>
                                    <View style={styles.pointsRow}>
                                        <TouchableOpacity style={styles.pointsButton} onPress={() => opposingTeamScore(3)}>
                                            <Text>+3</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.pointsButton} onPress={() => opposingTeamScore(2)}>
                                            <Text>+2</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.pointsButton} onPress={() => opposingTeamScore(1)}>
                                            <Text>+1</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.pointsButton} onPress={() => opposingTeamScore(-1)}>
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
                                            selectedMode === 'offense' && styles.selectedButton,
                                        ]}
                                        onPress={() => setSelectedMode('offense')}
                                    >
                                        <Text style={styles.buttonText}>Your Team</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.pointsButton} onPress={() => myTeamScore(3)}>
                                        <Text>+3</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.pointsButton} onPress={() => myTeamScore(2)}>
                                        <Text>+2</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.pointsButton} onPress={() => myTeamScore(1)}>
                                        <Text>+1</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.pointsButton} onPress={() => myTeamScore(-1)}>
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
                                            selectedMode === 'defense' && styles.selectedButton,
                                        ]}
                                        onPress={() => setSelectedMode('defense')}
                                    >
                                        <Text style={styles.buttonText}>Opponent</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.pointsButton} onPress={() => opposingTeamScore(3)}>
                                        <Text>+3</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.pointsButton} onPress={() => opposingTeamScore(2)}>
                                        <Text>+2</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.pointsButton} onPress={() => opposingTeamScore(1)}>
                                        <Text>+1</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.pointsButton} onPress={() => opposingTeamScore(-1)}>
                                        <Text>-1</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                        </View>
                </View>
                <View style={styles.wrapper}>
                    <View style={styles.statsContainer}>
                        <ExtraStats
                            setStatName={"Offensive Rebound"}
                            className="Offensive Rebound"
                            onPress={() => recordStats(currentPlayer, 'offensiveRebound')}
                        />
                        <ExtraStats
                            setStatName={"Assist"}
                            className="Assist"
                            onPress={() => recordStats(currentPlayer, 'assist')}
                        />
                        <ExtraStats
                            setStatName={"Steal"}
                            className="Steal"
                            onPress={() => recordStats(currentPlayer, 'steal')}
                        />
                        <ExtraStats
                            setStatName={"Defensive Rebound"}
                            className="Defensive Rebound"
                            onPress={() => recordStats(currentPlayer, 'defensiveRebound')}
                        />
                        <ExtraStats
                            setStatName={"Block"}
                            className="Block"
                            onPress={() => recordStats(currentPlayer, 'block')}
                        />
                        <ExtraStats
                            setStatName={"Turnover"}
                            className="Turnover"
                            onPress={() => recordStats(currentPlayer, 'turnover')}
                        />
                    </View>
                </View>
                <View style={styles.wrapper}>
                    <View style={styles.bottomContainer}>
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
                    </View>
                </View>
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
                        <View style={styles.buttonRow}>
                        <TouchableOpacity style={styles.button} onPress={handleMadeShot}>
                            <Text style={styles.buttonText}>Made</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.button} onPress={handleMissedShot}>
                            <Text style={styles.buttonText}>Missed</Text>
                        </TouchableOpacity>
                        </View>
                    </View>
                </View>
              </Modal>
            )}
        </>
    );
};

export default Drill;