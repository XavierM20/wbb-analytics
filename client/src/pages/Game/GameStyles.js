import zIndex from "@mui/material/styles/zIndex";
import { StyleSheet, Dimensions } from "react-native";

const { width: viewportWidth } = Dimensions.get('window');

export default StyleSheet.create({
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
    /*
        End Styles for player and court area
    */

    /*
        Styles for stats container
    */

    wrapper: {
        flex: 1,
        justifyContent: 'center', // centers vertically
        alignItems: 'center',     // centers horizontally
    },
    statsContainer: {
        backgroundColor: 'rgba(23, 43, 79, .5)',
        borderRadius: 8,
        //padding: viewportWidth * 0.02,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        height: viewportWidth * 0.13,
        width: viewportWidth * 0.7,
        color: 'white',
    },
    
    /*
        End Styles for stats container
    */

    /*
        Styles for bottom container (tempos and made/missed buttons)
    */
    bottomContainer: {
        flexDirection: 'row', 
        justifyContent: 'space-evenly',
        padding: 0,
    },
    /*
        End Styles for bottom container
    */
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
    // Styles for the team logos
    teamLogo: {
        width: 50,
        height: 50,
        marginLeft: 10,
    },
});