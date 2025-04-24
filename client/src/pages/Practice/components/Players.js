import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Players = ({ listA, setListA, listB, setListB, playerData, setPlayerData }) => {
    const serverUrl = process.env.REACT_APP_SERVER_URL;
    const navigate = useNavigate();
    const location = useLocation();

    let id1 = -1;
    if (location.pathname === '/CreateSession') {
        id1 = location.state.ID;
    }

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

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(serverUrl + '/api/players');
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

    // Show loading message until data is available
    if (!playerData || !listA || !listB) return <div>Loading players...</div>;

    return (
        <>
            <div className="list">
                <h2>Team A</h2>
                <ul>
                    {listA.map((player, index) => (
                        <li key={index} className="player-selection">
                            <select
                                className="dropdown"
                                value={player.playerName}
                                onChange={(e) => handlePlayerChange('A', index, e)}
                            >
                                {playerData
                                    .filter(p =>
                                        !listB.some(playerB => playerB.playerName === p.name) ||
                                        player.playerName === p.name
                                    )
                                    .map((p, playerIndex) => (
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
                                className="dropdown"
                                value={player.playerName}
                                onChange={(e) => handlePlayerChange('B', index, e)}
                            >
                                {playerData
                                    .filter(p =>
                                        !listA.some(playerA => playerA.playerName === p.name) ||
                                        player.playerName === p.name
                                    )
                                    .map((p, playerIndex) => (
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
