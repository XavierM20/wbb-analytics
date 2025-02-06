import './Game.css';
import { useNavigate } from 'react-router-dom';
import UndoButton from './components/UndoButton';
import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, Dimensions, Image } from 'react-native';
import ShotPopup from '../Drill/components/ShotPopup';
import GameSelection from './components/GameSelection';
import TempoTimer from '../Drill/components/TempoTimer';
import TempoButton from '../Drill/components/TempoButton';
import CancelButton from '../Drill/components/CancelButton';
import LastTempoDisplay from '../Drill/components/LastTempoDisplay';
import PlayerSelectionPopup from './components/PlayerSelectionPopup';
import ImagePicker from './components/ImagePicker';

// Get the screen height
const { height: screenHeight } = Dimensions.get('window');

const Game = () => {
    const [gameData, setGameData] = useState('');
    const [gameMode, setGameMode] = useState('');
    const [location, setLocation] = useState('');
    const [isTiming, setIsTiming] = useState(false);
    const [lastTempo, setLastTempo] = useState(null);
    const [tempoType, setTempoType] = useState(null);
    const [shotEvents, setShotEvents] = useState([]);
    const [SeasonData, setSeasonData] = useState([]);
    const [tempoFlag, setTempoFlag] = useState(false);
    const [tempoEvents, setTempoEvents] = useState([]);
    const [resetTimer, setResetTimer] = useState(false);
    const [currentTempo, setCurrentTempo] = useState(0);
    const [opponentTeam, setOpponentTeam] = useState('');
    const [tempLocation, setTempLocation] = useState('');
    const [shotOutcome, setShotOutcome] = useState(null);
    const [tempoEventIds, setTempoEventIds] = useState([]);
    const [submitClicked, setSubmitClicked] = useState(false);
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [newGameOverlay, setNewGameOverlay] = useState(false);
    const [opponentTeamValue, setOpponentTeamValue] = useState('');
    const [selectedClockTime, setSelectedClockTime] = useState(null);
    const [showPlayerSelection, setShowPlayerSelection] = useState(false);
    const [gameModeOverlayVisible, setGameModeOverlayVisible] = useState(true);
    const [loadGameOverlayVisible, setLoadGameOverlayVisible] = useState(false);
    const [tempoTableRows, setTempoTableRows] = useState([]);             // Table rows for tempo table
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [imageId, setImageId] = useState(null);

    const navigate = useNavigate();
    const serverUrl = process.env.REACT_APP_SERVER_URL;

    const currentDate = new Date();
    const date = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getDate().toString().padStart(2, '0')}`;
    
    // Sets an overlay for the input, can't interact outside until submission
    useEffect(() => {
        if (gameMode === 'new' && location !== '' && opponentTeam !== '' && submitClicked === false) {
            createGame();
            setNewGameOverlay(false); // Close the overlay here after creating the game
        }
    }, [opponentTeam, location, gameMode, submitClicked]);
    

    // Tempo requires an array, so set the player to an array and reset
    // the array afterwards, we only want 1 person per tempo, 1 element array
    useEffect(() => {
        if (tempoFlag) {
            const latestTempo = tempoEvents[tempoEvents.length - 1]; 
            submitTempo(tempoType, parseFloat(latestTempo.toFixed(2)));
            setTempoFlag(false);
        }
    }, [tempoFlag, tempoEvents, tempoType]);
    
    // Get the list of seasons 
    useEffect(() => {
        const handleCreateGame = async () => {
            try {
                if (SeasonData.length === 0) {
                    const response = await fetch(serverUrl + '/api/seasons');
                    const data = await response.json();
                    setSeasonData(data);
                }
            } catch (error) {
                console.error('Error fetching season data line 62:', error);
            }
        };
        handleCreateGame();
    }, [opponentTeam, location, SeasonData]);

    // Creates a new game if conditions are met
    useEffect(() => {
        if (gameMode === 'new' && location !== '' && opponentTeam !== '') {
            createGame();
        }
    }, [opponentTeam, location, gameMode]);
    
    // Submits the shot if conditions are met
    useEffect(() => {
        if (selectedPlayer !== null && shotOutcome !== null && selectedClockTime !== null) {
            submitShot(shotOutcome, selectedClockTime);
            setSelectedPlayer(null);
            setShotOutcome(null);
            setSelectedClockTime(null);
        }
    }, [selectedPlayer, shotOutcome, selectedClockTime]);

    // Initialize an empty game at first to generate gameID, as user adds tempos
    // and shots, it will add them when the game is submitted at the end
    const createGame = async () => {
        const seasonDate = getSeasonByDate();
        const game = {
            season_id: seasonDate._id,
            date: date,
            opponent: opponentTeam,
            location: location,
        };
    
        try {
            const response = await fetch(`${serverUrl}/api/games`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(game)
            });
    
            if (!response.ok) {
                throw new Error('Failed to create game. Please try again.');
            }

            const data = await response.json();
            setGameData(data._id);
            
        } catch (error) {
            console.error('Error with game data:', error.message);
        }
    };
    
   // Gets the season based on the current date, 2023-2024, 2024-2025, etc.
    const getSeasonByDate = () => {
        let finalYear;
        const currentDate = new Date();
        const month = currentDate.getMonth() + 1;
        const day = currentDate.getDate();
        const year = currentDate.getFullYear();

        const year1 = year.toString();
        const year2 = ((month < 8 || (month === 8 && day < 2)) ? year - 1 : year + 1).toString();
        
        if (month >= 8) {
            finalYear = SeasonData.find(season => season.year === year1 + '-' + year2);

        } else {
            finalYear = SeasonData.find(season => season.year === year2 + '-' + year1);
        }
        
        return finalYear;
    };
    
    const handleShotOutcome = async (outcome) => {
        setShotOutcome(outcome);
        setIsTiming(false);
        setLastTempo(parseFloat(currentTempo.toFixed(2)));
        setTempoEvents((prevTempoEvents) => [...prevTempoEvents, parseFloat(currentTempo.toFixed(2))]);
        setCurrentTempo(0);
        setTempoFlag(true);
    };
    

    const handleLocationClick = (location) => {
        setTempLocation(location);
    };
    
    const startTempo = (tempoType) => {
        setIsTiming(true);
        setTempoType(tempoType);
    };
    
    const handleClockTimeSelection = (timeMapping) => {
        setSelectedClockTime(timeMapping);
        setShowPlayerSelection(true);
    };
    
    const handlePlayerSelection = (selectedPlayerId) => {
        setSelectedPlayer(selectedPlayerId);
        setShowPlayerSelection(false);
    }; 

    const stopTempo = () => {
        setIsTiming(false);
        setLastTempo(parseFloat(currentTempo.toFixed(2)));
        setTempoEvents((prevTempoEvents) => [...prevTempoEvents, parseFloat(currentTempo.toFixed(2))]);
        setCurrentTempo(0);
        setTempoFlag(true);
    };
    
    // Makes sure that user input is valid before moving on
    const handleInputSubmission = () => {
        if (opponentTeamValue !== '' && tempLocation !== '') {
            setOpponentTeam(opponentTeamValue);
            setLocation(tempLocation);
            setSubmitClicked(true);
            setNewGameOverlay(false);
            
        } else {
            alert('Please enter both opponent name and location.');
        }
    };
    
    // If user loads in exisiting game, we load in all the data
    // so that we can add to it as they record more data
    const handleSelectGame = async (game) => {
        try {
            const response = await fetch(`${serverUrl}/api/games/${game._id}`);

            if (!response.ok) {
                throw new Error('Failed to fetch game details');
            }

            const gameDetails = await response.json();
            const teamLogo = await fetch(`${serverUrl}/api/games/image/${gameDetails.team_logo}`);
            console.log(teamLogo);
            setGameData(gameDetails._id);
            setOpponentTeam(gameDetails.opponent);
            setLocation(gameDetails.location);
            setTempoEventIds(gameDetails.tempo_events || []);
            setShotEvents(gameDetails.shot_events || []);
            setLoadGameOverlayVisible(false);
            setFilePreview(teamLogo.url);

        } catch (error) {
            console.error('Error fetching game details:', error);
        }
    };

    /*
        When tempoEventIds changes, add a row to the tempo table
    */
    // Wrap the logic in an async function (e.g., within useEffect or a handler)
    async function fetchTempoEvents() {
        for (const tempoId of tempoEventIds) {
            try {
                const response = await fetch(`${serverUrl}/api/tempos/${tempoId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch tempo details');
                }
                const tempoDetails = await response.json();
                const newRow = {
                    col1: tempoDetails.tempo_type,
                    col2: tempoDetails.transition_time,
                };
    
                setTempoTableRows((prevRows) => {
                    const exists = prevRows.some(row => row.col1 === newRow.col1 && row.col2 === newRow.col2);
                    return exists ? prevRows : [...prevRows, newRow];
                });
            } catch (error) {
                console.error('Error fetching tempo details:', error);
            }
        }
    }    
    
    // For React, call the async function (for example, inside a useEffect)
    useEffect(() => {
        fetchTempoEvents();
    }, [tempoEventIds]);

    /*
        Submits the shot to the shots database
    */
    const submitShot = (shotOutcome, shotClockTime) => {
        const shotData = {
            gameOrDrill_id: gameData,
            onModel: "Game",
            player_id: selectedPlayer,
            made: shotOutcome === 'made',
            shot_clock_time: shotClockTime,
            timestamp: new Date().toLocaleString()
        };

        fetch(serverUrl + '/api/shots', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(shotData)
        })

        .then(response => response.json())

        .then(data => {
            if (data !== null) {
                setShotEvents(prevShotEvents => [...prevShotEvents, data._id]);
            }
        })

        .catch(error => console.error('Error submitting shot line 218:', error));

    };
    
    const submitTempo = (tempoType, lastTempo) => {
        const tempoData = {
            gameOrDrill_id: gameData,
            onModel: "Game",
            tempo_type: tempoType,
            transition_time: lastTempo,
            timestamp: new Date().toLocaleString()
        };
    
        fetch(serverUrl + '/api/tempos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(tempoData)
        })
        .then(response => response.json())
        .then(data => {
            setTempoEventIds(prevIds => [...(prevIds || []), data._id]);
        })
        .catch(error => console.error('Error submitting tempo:', error));
    };
    
    // Submits the game to the games database and also stores the gameID in the 
    // seasons table, only posts to the season table if the gameID does not exist there.
    const submitGame = async () =>{
        const uploadedImageId = await uploadImage();
        const seasonData = getSeasonByDate();
    
        const gameDataUpdated = {
            season_id: seasonData._id,
            date: date,
            opponent: opponentTeam,
            location: location,
            tempo_events: tempoEventIds,
            shot_events: shotEvents,
            team_logo: uploadedImageId
        };

        console.log("Game Data: " + gameData);
        console.log("UploadedImageID: " +  uploadedImageId);
        console.log(gameDataUpdated);
    
        fetch(`${serverUrl}/api/games/${gameData}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(gameDataUpdated)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok.');
            }
            return response.json();
        })
        .then(data => {
            // Check if the current game ID is already in the games array
            if (!seasonData.games.includes(gameData)) {
                // If not included, add it
                const updatedGames = [...seasonData.games, gameData];
    
                return fetch(`${serverUrl}/api/seasons/${seasonData._id}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        year: seasonData.year,
                        games: updatedGames
                    })
                });
            } else {
                return Promise.resolve();
            }
        })
        .then(response => {
            if (response && !response.ok) {
                throw new Error('Failed to update season with new game ID.');
            }
            if (response) return response.json();
        })
        .then(() => {
            alert("Game submission successful.");
            navigate('/homepage');
        })
        .catch(error => {
            console.error('Error during game or season update:', error);
        });
    }; 

    const deleteGame = () => {
        // Need to add this functionality here
    };
    
    // Undos the last recorded tempo, removes it from database and removes it from the list
    const undoTempo = () => {
        if (tempoEvents.length > 0) {
            const lastTempoEvent = tempoEvents[tempoEvents.length - 1];
            
            if (lastTempoEvent.id) {
                fetch(`${serverUrl}/api/tempos/${lastTempoEvent.id}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to delete the tempo from the backend.');
                    }
                })
                .catch(error => console.error('Error deleting tempo:', error));
            }
    
            setTempoEvents(prevTempoEvents => prevTempoEvents.slice(0, -1));
            setTempoEventIds(prevIds => prevIds.slice(0, -1));
            
            const newLastTempo = tempoEvents[tempoEvents.length - 2];
            setLastTempo(newLastTempo);
        }
    };

    /* 
        Function to add a row to the tempo table 
        Functionality: Adds a row to a table, row contains 
        the tempoType variable (offensive/defensive) and the
        currentTempo variable (time elapsed in seconds)
    */
    const addRowToTempoTable = () => {
        const newRow = { col1: tempoType, col2: lastTempo };
    
        setTempoTableRows((prevRows) => {
            // Check if the row already exists in the table
            const exists = prevRows.some(row => row.col1 === newRow.col1 && row.col2 === newRow.col2);
            return exists ? prevRows : [...prevRows, newRow];
        });
    };        

    const uploadImage = async() => {
        if (!selectedFile) {
            console.log('No file selected');
            return null;
        }

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const response = await fetch(`${serverUrl}/api/games/uploadLogo`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            console.log('Image uploaded:', data.id);
            setImageId(data.id);
            return data.id;
        } catch (error) {
            console.error('Error uploading image:', error);
            return null;
        }
    }
    
    return (
        <>
            {gameModeOverlayVisible && (
                <div className="game-mode-overlay">
                    <div className="game-mode-content">
                        {/* Close button in the corner */}
                        <div className="game-selection">
                            <button onClick={() => {setGameMode('new');setGameModeOverlayVisible(false);setNewGameOverlay(true);}}>Create New Game</button>
                            <button onClick={() => {setGameMode('load');setGameModeOverlayVisible(false);setLoadGameOverlayVisible(true);}}>Load Existing Game</button>
                        </div>
                    </div>
                </div>
            )}
            {newGameOverlay && gameMode === 'new' && (
                <div className="new-game-overlay">
                    <div className="new-game-overlay-content">
                        <h3>Opponent Team Name</h3>
                        <input id="opponent-team-input" type="text" value={opponentTeamValue} onChange={(e) => setOpponentTeamValue(e.target.value)}/>
                        <ImagePicker setSelectedFile={setSelectedFile} setFilePreview={setFilePreview} buttonText='Upload Team Logo' displayFileName/>
                        <h3>Location</h3>
                        <button onClick={() => handleLocationClick('home')} className={tempLocation === 'home' ? '' : 'disabled'} disabled={tempLocation === 'home'}>Home</button>
                        <button onClick={() => handleLocationClick('away')} className={tempLocation === 'away' ? '' : 'disabled'} disabled={tempLocation === 'away'}>Away</button>
                        <div className='submit-button'>
                            <button onClick={handleInputSubmission}>Submit</button>
                        </div>
                    </div>
                </div>
            )}
            {loadGameOverlayVisible && gameMode === 'load' && (
                <div className="load-game-overlay">
                    <div className="load-game-overlay-content">
                        <GameSelection className="game-selection" onSelectGame={handleSelectGame}/>
                    </div>
                </div>
            )}
            <div className="main">
                <button className='btn-home top-right-button' onClick={() => navigate('/homepage')}>Home</button>
                <Text style={{ color: 'white',
                    fcolor: 'yellow',
                    fontSize: 24,
                    fontWeight: 'bold',
                    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Set the background color
                    padding: 5,             // Add padding to space the text from the background edges
                    borderRadius: 10,       // Optional: Add rounded corners
                    }}>
                    TN Tech vs {opponentTeam}
                    {filePreview && (
                        <Image 
                            source={{ uri: filePreview }}  
                            style={styles.teamLogo} 
                            onError={(error) => console.error("Image Load Error:", error.nativeEvent)}
                        />
                    )}
                </Text>
                <div className='tempo-timer'>
                    <TempoTimer 
                        isTiming={isTiming}
                        resetTimer={resetTimer}
                        setResetTimer={setResetTimer}
                        currentTime={currentTempo}
                        setCurrentTime={setCurrentTempo}
                    />
                </div>
                <div className="game-tempo-container">
                    <div className="last-tempo-container">
                    <View style={styles.table}>
                        {/* Table Header */}
                        <View style={[styles.row, styles.header]}>
                        <Text style={[styles.cell, styles.headerText]}>Last Tempo</Text>
                        <Text style={[styles.cell, styles.headerText]}>Duration</Text>
                        </View>

                        {/* Scrollable Table Body */}
                        <ScrollView style={[styles.scrollableBody, { height: screenHeight * 0.2 }]} showsVerticalScrollIndicator={false}>
                        {tempoTableRows.map((row, index) => (
                            <View key={index} style={styles.row}>
                            <Text style={styles.cell}>{row.col1}</Text>
                            <Text style={styles.cell}>{row.col2}</Text>
                            </View>
                        ))}
                        </ScrollView>
                    </View>
                    </div>
                    <div className="offensive-tempo-button">
                        <TempoButton
                            tempoType="Offensive"
                            className={`TempoButton ${isTiming && tempoType !== 'offensive' ? 'disabled' : ''} ${isTiming && tempoType === 'offensive' ? 'stop' : 'start'}`}
                            isTiming={isTiming && tempoType === 'offensive'}
                            onClick={() =>
                                isTiming && tempoType === 'offensive'
                                    ? stopTempo('offensive')
                                    : startTempo('offensive')
                            }
                            disabled={isTiming && tempoType !== 'offensive'}
                        />
                    </div>
                    <div className="defensive-tempo-button">
                        <TempoButton
                            tempoType="Defensive"
                            className={`TempoButton ${isTiming && tempoType !== 'defensive' ? 'disabled' : ''} ${isTiming && tempoType === 'defensive' ? 'stop' : 'start'}`}
                            isTiming={isTiming && tempoType === 'defensive'}
                            onClick={() =>
                                isTiming && tempoType === 'defensive'
                                    ? stopTempo('defensive')
                                    : startTempo('defensive')
                            }
                            disabled={isTiming && tempoType !== 'defensive'}
                        />
                    </div>
                </div>
                <div className="shotContainer">
                    <ShotPopup
                        isOpen={newGameOverlay}
                        onClose={() => setNewGameOverlay(true)}
                    />
                    <>
                        <div className="MadeButton" onClick={() => handleShotOutcome('made')}>Made</div>
                        <div className="MissedButton" onClick={() => handleShotOutcome('missed')}>Missed</div>
                    </>
                </div>
                {showPlayerSelection && (
                    <PlayerSelectionPopup
                        onPlayerSelect={handlePlayerSelection}
                        seasonId={getSeasonByDate()._id}
                    />
                )}
                <div className="submit-delete-container">
                    <button className="submit-game-button" onClick={submitGame}> Submit Game </button>
                    <button className="delete-game-button" onClick={deleteGame}> Delete Game </button>
                </div>
            </div>
        </>
    );
}
const styles = StyleSheet.create({
    table: {
      width: '100%',
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 4,
      margin: 16,
    },
    row: {
      flexDirection: 'row',
    },
    header: {
      backgroundColor: '#f1f1f1',
      borderBottomWidth: 1,
      borderColor: '#ccc',
    },
    headerText: {
      fontWeight: 'bold',
      textAlign: 'center',
    },
    scrollableBody: {
      height: 100,
      backgroundColor: 'white',
    },
    cell: {
      flex: 1,
      padding: 8,
      textAlign: 'center',
      borderRightWidth: 1,
      borderColor: '#ccc',
      backgroundColor: 'white',
    },
    teamLogo: {
        width: 50,
        height: 50,
        marginLeft: 10,
    },
  });

export default Game;