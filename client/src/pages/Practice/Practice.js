import React, { useState, useEffect } from 'react';
import './Practice.css';
import DrillButtons from './components/DrillButtons';
import { useNavigate } from 'react-router-dom';
import Players from './components/Players';
import SessionButtons from './components/SessionButtons';

const Practice = () => {
    const [SeasonData, setSeasonData] = useState([]);
    const [SessionData, setSessionData] = useState([]);
    const [drills, setDrills] = useState([]);
    const [date, setDate] = useState('');
    const [listA, setListA] = useState([]);
    const [listB, setListB] = useState([]);
    const [playerData, setPlayerData] = useState([]);
    const serverUrl = process.env.REACT_APP_SERVER_URL;
    const navigate = useNavigate();

    useEffect(() => {
        const handleCreatePractice = async () => {
            try {
                const data = await getSeasonDataByDate();
                setSeasonData(data);
            } catch (error) {
                console.error('Error fetching season data:', error);
            }

            const currentDate = new Date();
            const newDate = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getDate().toString().padStart(2, '0')}`;
            setDate(newDate);
        };

        handleCreatePractice();
    }, []);

    const getSeasonDataByDate = async () => {
        const currentDate = new Date();
        const month = currentDate.getMonth() + 1;
        const day = currentDate.getDate();
        const year = currentDate.getFullYear();

        const computedYear = (month < 8 || (month === 8 && day < 2)) ? year - 1 : year + 1;

        const year1 = Math.min(year, computedYear).toString();
        const year2 = Math.max(year, computedYear).toString();

        const seasonResponse = await fetch(`${serverUrl}/api/seasons/endYear/${year2}/${sessionStorage.getItem('schoolID')}`);
        const seasonData = await seasonResponse.json();
        return seasonData;
    };

    useEffect(() => {
        if (SeasonData && date) {
            const practiceData = {
                season_id: SeasonData._id,
                date: date,
            };

            const createPracticeSession = async () => {
                try {
                    const response = await fetch(serverUrl + '/api/practices', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(practiceData),
                    });
                    const data = await response.json();
                    setSessionData(data);
                } catch (error) {
                    console.error('Error creating practice:', error);
                }
            };

            createPracticeSession();
        }
    }, [SeasonData, date]);

    const updatePractice = async () => {
        if (drills.length > 0) {
            const practiceData = {
                season_id: SeasonData._id,
                date: date,
                drills: drills.map(drill => drill._id),
                team_purple: listA.map(player => player._id),
                team_gray: listB.map(player => player._id),
            };

            try {
                const response = await fetch(serverUrl + `/api/practices/${SessionData._id}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(practiceData),
                });
                if (!response.ok) throw new Error('Network response was not ok');
                const updatedPractice = await response.json();
                navigate(`/drill?PracticeID=${updatedPractice._id}&DrillID=${drills[0]._id}`);
            } catch (error) {
                console.error('Failed to update practice:', error);
            }
        } else {
            console.log('Please add drills to the practice');
        }
    };

    const addDrill = async drill => {
        const drillData = {
            name: drill.name,
            practice_id: SessionData._id,
        };
        try {
            const response = await fetch(serverUrl + '/api/drills', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(drillData),
            });
            if (!response.ok) throw new Error('Network response was not ok');

            const newDrill = await response.json();
            setDrills(currentDrills => [...currentDrills, newDrill]);

            const players = [...listA, ...listB];
            players.forEach(async player => {
                const statsData = {
                    drill_id: newDrill._id,
                    player_id: player._id,
                    offensive_rebounds: 0,
                    defensive_rebounds: 0,
                    assists: 0,
                    steals: 0,
                    blocks: 0,
                    turnovers: 0,
                };

                try {
                    await fetch(serverUrl + '/api/stats', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(statsData),
                    });
                } catch (error) {
                    console.error('Failed to add stats:', error);
                }
            });
        } catch (error) {
            console.error('Failed to add drill:', error);
        }
    };

    const updateDrill = async drill => {
        try {
            const response = await fetch(`${serverUrl}/api/drills/${drill._id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: drill.name,
                    practice_id: SessionData._id,
                }),
            });

            if (!response.ok) throw new Error('Network response was not ok');

            const updatedDrill = await response.json();
            setDrills(currentDrills => currentDrills.map(d => (d._id === drill._id ? updatedDrill : d)));
        } catch (error) {
            console.error('Failed to update drill:', error);
        }
    };

    const createPractice = async () => {
        await updatePractice();
    };

    return (
        <div className="practice-container">
            <button className='btn-home top-right-button' onClick={() => navigate('/homepage')}>Home</button>
            <div className="create-sessions-container">
                <div className="drills-column">
                    <div className="drill-buttons">
                        <h2>Drills</h2>
                        <DrillButtons
                            drills={drills}
                            setDrills={setDrills}
                            onAddDrill={addDrill}
                            onUpdateDrill={updateDrill}
                            practiceID={SessionData._id}
                        />
                    </div>
                    <div className="session-information">
                        <h2>Date</h2>
                        <SessionButtons setDate={setDate} />
                    </div>
                </div>
                <div className="lists-column">
                    <Players
                        listA={listA}
                        setListA={player => {
                            if (!listA.some(p => p._id === player._id) && !listB.some(p => p._id === player._id)) {
                                setListA([...listA, player]);
                            }
                        }}
                        listB={listB}
                        setListB={player => {
                            if (!listB.some(p => p._id === player._id) && !listA.some(p => p._id === player._id)) {
                                setListB([...listB, player]);
                            }
                        }}
                        playerDataA={playerData.filter(player => !listB.some(p => p._id === player._id))}
                        playerDataB={playerData.filter(player => !listA.some(p => p._id === player._id))}
                        setPlayerData={setPlayerData}
                    />
                </div>
            </div>
            <button onClick={createPractice} className="create-session-button">Create Practice</button>
        </div>
    );
};

export default Practice;
