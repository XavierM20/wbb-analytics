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
                const response = await fetch(serverUrl + '/api/seasons');
                const data = await response.json();
                setSeasonData(data);
            } catch (error) {
                console.error('Error fetching season data:', error);
            }

            const currentDate = new Date();
            const newDate = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1)
                .toString()
                .padStart(2, '0')}-${currentDate.getDate().toString().padStart(2, '0')}`;
            setDate(newDate);
        };

        handleCreatePractice();
    }, []);

    useEffect(() => {
        if (SeasonData.length > 0 && date) {
            const seasonByDate = getSeasonByDate(date);
            if (seasonByDate) {
                const practiceData = {
                    season_id: seasonByDate._id,
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
        }
    }, [SeasonData, date]);

    const updatePractice = async () => {
        if (drills.length > 0) {
            const seasonByDate = getSeasonByDate(date);

            const practiceData = {
                season_id: seasonByDate._id,
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

            const players = listA.concat(listB);
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
                    const response = await fetch(serverUrl + '/api/stats', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(statsData),
                    });
                    if (!response.ok) throw new Error('Network response was not ok');
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

    return (
        <div className="practice-container">
            <button className='btn-home top-right-button' onClick={() => navigate('/homepage')}>Home</button>
            <div className="create-sessions-container">
                <div className="drills-column">
                    <div className="drill-buttons">
                        <>
                            <h2>Drills</h2>
                            <DrillButtons
                                drills={drills}
                                setDrills={setDrills}
                                onAddDrill={addDrill}
                                onUpdateDrill={updateDrill}
                                practiceID={SessionData._id}
                            />
                        </>
                    </div>

                    <div className="session-information">
                        <>
                            <h2>Date</h2>
                            <SessionButtons setDate={setDate} />
                        </>
                    </div>
                </div>
                <div className="lists-column">
                    <Players
                        listA={listA}
                        setListA={setListA}
                        listB={listB}
                        setListB={setListB}
                        playerData={playerData}
                        setPlayerData={setPlayerData}
                    />
                </div>
            </div>
            <button onClick={() => navigate('/drill')} className="create-session-button">Create Practice</button>
            {/*onClick={updatePractice}>//
            //</div>Create Practice*/}
        </div>
    );
};

export default Practice;
