import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Players = ({ listA, setListA, listB, setListB, playerData, setPlayerData }) => {

    const serverUrl = process.env.REACT_APP_SERVER_URL;

    const handleAddDropdownA = () => {
        const newPlayer = playerData.length > listA.length ? playerData[listA.length].name : `New Player ${listA.length + 1}`;
        setListA([...listA, { playerName: newPlayer }]);
    };

    const handleAddDropdownB = () => {
        const newPlayer = playerData.length > listB.length ? playerData[listB.length].name : `New Player ${listB.length + 1}`;
        setListB([...listB, { playerName: newPlayer }]);
    };

    const handlePlayerChange = (team, index, event) => {
        const { value } = event.target;

        if (team === 'A') {
            const updatedListA = listA.map((player, i) => {
                if (i === index) {
                    return { ...player, playerName: value, _id: playerData.find(p => p.name === value)._id };
                }
                return player;
            });
            setListA(updatedListA);
        } else if (team === 'B') {
            const updatedListB = listB.map((player, i) => {
                if (i === index) {
                    return { ...player, playerName: value, _id: playerData.find(p => p.name === value)._id };
                }
                return player;
            });
            setListB(updatedListB);
        }
    };

    const handleRemovePlayer = (team, index) => {
        if (team === 'A') {
            const updatedListA = [...listA];
            updatedListA.splice(index, 1);
            setListA(updatedListA);
            console.log(`Removed player from Team A at index ${index}`);
        } else if (team === 'B') {
            const updatedListB = [...listB];
            updatedListB.splice(index, 1);
            setListB(updatedListB);
            console.log(`Removed player from Team B at index ${index}`);
        }
    };

    const navigate = useNavigate();
    let id1 = -1;
    const location = useLocation();

    if (location.pathname === '/CreateSession') {
        id1 = location.state?.ID || -1;
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                const seasonID = await getSeasonIDByDate();
                const response = await fetch(`${serverUrl}/api/players/bySeason/${seasonID}`);
                const data = await response.json();

                const defaultListA = data.slice(0, 5).map(player => ({ _id: player._id, playerName: player.name }));
                const defaultListB = data.slice(5, 10).map(player => ({ _id: player._id, playerName: player.name }));

                setListA(defaultListA);
                setListB(defaultListB);
                setPlayerData(data);
            } catch (error) {
                console.error('Failed to fetch players:', error);
            }
        };

        fetchData();
    }, []);

    const getSeasonIDByDate = async () => {
        const currentDate = new Date();
        const month = currentDate.getMonth() + 1;
        const day = currentDate.getDate();
        const year = currentDate.getFullYear();

        const computedYear = (month < 8 || (month === 8 && day < 2)) ? year - 1 : year + 1;

        const year1 = Math.min(year, computedYear).toString();
        const year2 = Math.max(year, computedYear).toString();

        const seasonResponse = await fetch(`${serverUrl}/api/seasons/endYear/${year2}/${sessionStorage.getItem('schoolID')}`);
        const seasonData = await seasonResponse.json();
        return seasonData._id;
    };

    // Show a loading screen until playerData is available
    if (!Array.isArray(playerData)) {
        return <div>Loading players...</div>;
    }

    return (
        <>
            <div className="list">
                <h2>Team A</h2>
                <ul>
                    {listA.map((player, index) => (
                        <li key={index} className="player-selection">
                            <select
                                className='dropdown'
                                value={player.playerName}
                                onChange={(e) => handlePlayerChange('A', index, e)}
                            >
                                {Array.isArray(playerData) && playerData.map((p, playerIndex) => (
                                    <option key={playerIndex} value={p.name}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                            <button className="remove-player-button" onClick={() => handleRemovePlayer('A', index)}>
                                <i className="fas fa-trash"></i>
                            </button>
                        </li>
                    ))}
                    <li>
                        <button className="add-dropdown-button" onClick={handleAddDropdownA}>
                            Add Player
                        </button>
                    </li>
                </ul>
            </div>

            <div className="list">
                <h2>Team B</h2>
                <ul>
                    {listB.map((player, index) => (
                        <li key={index} className="player-selection">
                            <select
                                className='dropdown'
                                value={player.playerName}
                                onChange={(e) => handlePlayerChange('B', index, e)}
                            >
                                {Array.isArray(playerData) && playerData.map((p, playerIndex) => (
                                    <option key={playerIndex} value={p.name}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                            <button className="remove-player-button" onClick={() => handleRemovePlayer('B', index)}>
                                <i className="fas fa-trash"></i>
                            </button>
                        </li>
                    ))}
                    <li>
                        <button className="add-dropdown-button" onClick={handleAddDropdownB}>
                            Add Player
                        </button>
                    </li>
                </ul>
            </div>
        </>
    );
};

export default Players;
