import React, { useState, useEffect } from 'react';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import { fade, makeStyles } from '@material-ui/core/styles';
import MenuIcon from '@material-ui/icons/Menu';
import AccountCircle from '@material-ui/icons/AccountCircle';
import MenuItem from '@material-ui/core/MenuItem';
import Menu from '@material-ui/core/Menu';
import SearchIcon from '@material-ui/icons/Search';
import InputBase from '@material-ui/core/InputBase';
import { NeuDiv } from "neumorphism-react";
import { Grid, Paper } from "@material-ui/core"
import Avatar from '@material-ui/core/Avatar';
import { NeuButton } from "neumorphism-react";
import 'fontsource-antic-slab';
import TextField from '@material-ui/core/TextField';
import { Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as routineActions from '../../../actions/routineFunctions'
import { useSelector, useDispatch } from 'react-redux';
import 'fontsource-antic-slab';




const useStyles = makeStyles((theme) => ({
    root: {

    },

    listStyle: {
        listStyle: 'none',
        marginLeft: 50,
        width: '70%',
    },

    listItemStyle: {
        // borderTop: '1px solid gray',
        padding: 10,
    },

}));

const Comment = ({postID}) => {
    const classes = useStyles();
    const dispatch = useDispatch()
    const {update} = useSelector(state => state.routineReducers)

    const [content, setContent] = useState([])
    const [creator, setCreator] = useState([])
    const [data, setData] = useState([])


   
    useEffect(() => {
        dispatch(routineActions.getComments(postID, (response) => {
            console.log(response.data.map(a => a.content));
            
            setContent(response.data.map(a => a.content));
            setCreator(response.data.map(a => a.creator));
            }
        ))
        
    }, [update])
    console.log(content)
    console.log(creator)

    


    return (
        <div className={classes.root}>
            <ul className={classes.listStyle}>
                {content.map((item, i) => (
                    <li className={classes.listItemStyle}> <p style={{ color: "black" }, { fontFamliy: 'Antic Slab' }}>{creator[i]}: {item}</p></li>

                ))}

            {/* <li className={classes.listItemStyle}> <p style={{ color: "black" }, { fontFamliy: 'Antic Slab' }}>creator[0]: youre so cool</p></li>

                <li className={classes.listItemStyle}> <p style={{ color: "black" }, { fontFamliy: 'Antic Slab' }}>Rishi Petrolhead: youre so cool</p></li>
                <li className={classes.listItemStyle}> <p style={{ color: "black" }, { fontFamliy: 'Antic Slab' }}>Rishi Petrolhead: but is this GOOOOD water?</p></li>
                <li className={classes.listItemStyle}> <p style={{ color: "black" }, { fontFamliy: 'Antic Slab' }}>Rishi Petrolhead: hydrohomie for life #lovewater #420blazeit</p></li>
                <li className={classes.listItemStyle}> <p style={{ color: "black" }, { fontFamliy: 'Antic Slab' }}>Rishi Petrolhead: this is the best website ever wow can i buy it for $50B?</p></li>
                <li className={classes.listItemStyle}> <p style={{ color: "black" }, { fontFamliy: 'Antic Slab' }}>Rishi Petrolhead: Hi tim</p></li>
                <li className={classes.listItemStyle}> <p style={{ color: "black" }, { fontFamliy: 'Antic Slab' }}>Rishi Petrolhead: comment</p></li>

 */}

            </ul>

        </div>
    )
}

export default Comment