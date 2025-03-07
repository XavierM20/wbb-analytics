import React, { useState, useEffect } from 'react';

const GameSelection = ({ onSelectGame }) => {
    const [games, setGames] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [SeasonData, setSeasonData] = useState([]);
    const [schoolID, setSchoolID] = useState(sessionStorage.getItem("schoolID"));

    useEffect(() => {
        
        const fetchGames = async () => {
            try {
                /*
                    First get current season
                */
                // Find the current seasons year(s)
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
                console.log(seasonData._id);

                const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/api/games/${seasonData._id}`);
                const data = await response.json();

                // Oldest - Newest (Ascending)
                // const sortedGames = data.sort((a, b) => new Date(a.date) - new Date(b.date));

                // Newest - Oldest (Descending)
                const sortedGames = data.sort((a, b) => new Date(b.date) - new Date(a.date));
                setGames(sortedGames);

            } catch (error) {
                console.error('Failed to fetch games:', error);
            }
            setIsLoading(false);
        };

        fetchGames();
    }, []);

    return (
        <div className="game-selection-container">
            <h3 style={{ color: '#503291', fontWeight: 'bold' }}> Select Game To Load </h3>
                {isLoading ? <p style={{ color: '#503291', fontWeight: 'bold' }}> Loading Games </p> : (
                    games.length > 0 ? (
                        <ul>
                            {games.map(game => (
                                <li key={game._id} className="game-entry" onClick={() => onSelectGame(game)}>
                                    {game.opponent} - {new Date(game.date).toLocaleDateString()}
                                </li>
                            ))}
                        </ul>
                    ) : <p style={{ color: '#503291', fontWeight: 'bold' }}> No games available to load. </p>
                )}
        </div>
    );
};

export default GameSelection;
