import React from "react";
import {
    Switch,
    ColorPicker,
    BriSlider
} from "./Components.js";

class LightContainer extends React.Component {
    render() {
        return(
            <div className = "lightContainer">
                <div className = "editLightContainer">
                    <input
                        type = "button"
                        className = "editIcon"
                        onClick = { () => this.props.editHandler() }
                    />
                </div>
                <div>
                    <br></br>
                    <h3>
                        { this.props.name }
                    </h3>
                </div>
                <div className = "tableWrapper">
                    <table>
                        <tbody>
                            <tr>
                                <td>
                                    <Switch
                                        on = { this.props.on }
                                        name = { this.props.name }
                                        toggle = { () => this.props.toggle() }
                                    />
                                </td>
                                <td>
                                    <ColorPicker
                                        color = { this.props.color }
                                        showCP = { this.props.showCP }
                                        onColorPickerClick = { () => this.props.toggleCP() }
                                        dismissCP = { () => this.props.dismissCP() }
                                        onChange = { (c) => this.props.updateColor(c) }
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td colSpan = "2">
                                    <BriSlider
                                        bri = { this.props.bri }
                                        cachedBri = { this.props.cachedBri }
                                        onChange = { (event) => this.props.updateBri(event) }
                                    />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        )
    }
}

class LightForm extends React.Component {

    constructor(props) {
        super(props);
        let name = this.props.editName
        this.state = { name };
    }

    validateForm() {
        return (this.state.name === "") ? false : true;
    }

    updateNameState(event) {
        var name = event.target.value;
        let newState = { ...this.state, name };
        this.setState(newState);
    }

    render() {
        return (
            <div className="groupWrapper">
                <div className="createGroupContainer">
                    <div className="backContainer">
                        <input
                            type = "button"
                            className = "backIcon"
                            onClick = { () => this.props.onClickBack() }
                        />
                    </div>
                    <div className = "groupName">
                        <h3>Editing Light</h3>
                    </div>
                    <form onSubmit = { (event) => { this.props.onClickSubmit(event) }} >
                        Name: { " " }
                        <input
                            name = "newName"
                            type = "text"
                            value = { this.state.name }
                            onChange = { (event) => this.updateNameState(event) }
                            maxLength = "32"
                        />
                        <p></p>
                        <input
                            type = "submit"
                            disabled = { !this.validateForm() }
                            className = "roundedButton"
                            value = { "Update" }
                        />
                    </form>
                </div>
            </div>
        );
    }
}

export {
    LightContainer,
    LightForm
}