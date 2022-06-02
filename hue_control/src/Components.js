import { GithubPicker } from "react-color";
import reactCSS from "reactcss";
import React from "react";

class Switch extends React.Component {

    render() {
        return (
            <div className="switchContainer">
                <label className="switch">
                    <input
                        type = "checkbox"
                        checked = { this.props.on }
                        onChange = { () => this.props.toggle() }
                    />
                    <span className = "slider round" ></span>
                </label>
            </div>
        );
    }
}
  
class BriSlider extends React.Component {
  
    render() {
        return(
            <div className="slideContainer">
                <input
                    className = "actualslider"
                    type = "range" 
                    min = "1"
                    max = "254"
                    step = "23"
                    value = { this.props.cachedBri != -1 ? this.props.cachedBri : this.props.bri }
                    onChange = { (ch) =>  this.props.onChange(ch) }
                />
                <img src = "bri.png" width = "16" height = "16" />
            </div>
        );
    }
}
  
class ColorPicker extends React.Component {
  
    render() {
        const styles = reactCSS({
            'default': {
                color: {
                    width: '60px',
                    height: '30px',
                    borderRadius: '20px',
                    background: `rgba(${ this.props.color.r }, ${ this.props.color.g }, ${ this.props.color.b }, ${ this.props.color.a })`,
                },
                popover: {
                    position: 'absolute',
                    zIndex: '2',
                },
                cover: {
                    top: '0px',
                    right: '0px',
                    bottom: '0px',
                    left: '0px',
                    position: 'fixed',            
                },
                swatch: {  
                    borderRadius: '20px',
                    cursor: 'pointer',
                    display: 'inline-block',
                    boxShadow: '0 0 0 0px rgba(1,1,1,.3)',
                },          
            },
        });

        return(
            <div className="colorContainer">
                <div style={ styles.swatch } onClick = { () => this.props.onColorPickerClick() }>
                    <div style = { styles.color } />
                    </div>
                    { this.props.showCP ? <div style = { styles.popover }>
                    <div
                        style = { styles.cover }
                        onClick = { () => this.props.dismissCP() }
                    />
                    <GithubPicker
                        colors =    {["#f3fdfe", "#fefae0", "#feecba", "#fedf9a", "#fed27f", "#fec667", "#febb53", "#feb141",
                                        "#ff7c5e", "#ff915a", "#feac50", "#ffd566", "#fffb71", "#dffe77", "#c6ff7c", "#afff7c",
                                        "#7893ff", "#7ec0fe", "#8feeff", "#89ffe5", "#9fffc2", "#94ffa6", "#93ff8e", "#acfe87",
                                        "#5236ff", "#a264ff", "#cf77ff", "#fd8cff", "#fe82d9", "#ff79b6", "#ff7a97", "#ff7479",
                                        "#fe2202", "#fe6f16", "#fea024", "#fece32", "#fcfe40", "#cafe41", "#9bfe41", "#69fe41",
                                        "#3876fe", "#37adfe", "#37dffe", "#31feea", "#25febe", "#1afe97", "#0efe70", "#00fe41",
                                        "#3800fe", "#810afe", "#b514fe", "#e81dfe", "#fe22e1", "#fe22b4", "#fe228b", "#fe225d",
                                    ]}
                                    color = { this.props.color }
                                    onChange = { (c) => this.props.onChange(c) }
                    />
                </div> : null }
            </div>
        );
    }
}

class NavBar extends React.Component {
    render() {
        return(
            <table className = "nav">
                <tbody>
                    <tr>
                        <td>
                            <input
                                type = "button"
                                className = { this.props.view === "lights" ? "nav1pressed" : "nav1" }
                                onClick = { () => this.props.clickHandler("lights") }
                            />
                        </td>
                        <td>
                            <input
                                type = "button"
                                className = { this.props.view === "groups" ? "nav2pressed" : "nav2" }
                                onClick = { () => this.props.clickHandler("groups") }
                            />
                        </td>
                        <td>
                            <input
                                type = "button"
                                className = { this.props.view === "schedules" ? "nav3pressed" : "nav3" }
                                onClick = { () => this.props.clickHandler("schedules") }
                            />
                        </td>
                        <td>
                            <input
                                type = "button"
                                className = { this.props.view === "reset" ? "nav4pressed" : "nav4" }
                                onClick = { () => this.props.clickHandler("reset") }
                            />
                        </td>
                    </tr>
                </tbody>
            </table>
    
        )
    }
}

export {
    ColorPicker,
    BriSlider,
    Switch,
    NavBar
}