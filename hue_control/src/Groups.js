import React from "react";
import {
    Switch,
    ColorPicker,
    BriSlider
} from "./Components.js";

class GroupContainer extends React.Component {

    render() {
        return(
            <div className = "groupContainer">
                <div className = "editContainer">
                    <input
                        type = "button"
                        className = "editIcon"
                        onClick = { () => this.props.createGroupHandler() }
                    />
                </div>
                <div className="deleteContainer">
                    <input
                        type = "button"
                        className = "deleteIcon"
                        onClick = { () => this.props.deleteGroupHandler() }
                    />
                </div>
                <div className = "goupName">
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
                                <td colSpan = "2" className = "sliderRow">
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
        );
    }
}

class DeleteGroupContainer extends React.Component {
    render() {
        return(
            <div className = "deleteGroupContainer">
                <div className = "groupName">
                    <p></p>
                    <h3>
                        { this.props.name }
                    </h3>
                    <p></p>
                    Are you sure you want<br></br>to delete this group?
                </div>
                <input
                    type = "button"
                    value = "Yes"
                    className="roundedButton"
                    onClick={() => this.props.deleteGroup(this.props.mkey)}
                />
                <input
                    type = "button"
                    value = "No"
                    className="roundedButton"
                    onClick = { () => this.props.cancelDeleteGroup(this.props.mkey) }
                />
        </div>
        );
    }
}

class GroupForm extends React.Component {

    constructor(props) {
        super(props);
        var checks = {};
        let checkCounter = 0;
        for (let k in this.props.lights) {
            checks[k] = false;
        }
        if (this.props.edit) {
            for (let k in checks) {
                if (this.props.activeLights.includes(parseInt(k))) {
                    checks[k] = true;
                    checkCounter ++;
                } 
            }
        }
        let name = this.props.edit ? this.props.editName : "";
        this.state = { checked: checkCounter, name, checks };
    }

    validateForm() {
        return (this.state.checked === 0 || this.state.name === "") ? false : true;
    }

    updateCBState(event, key) {
        var checked = this.state.checked;
        if (event.target.checked) {
            checked ++;
        } else {
            checked --;
        }
        let checks = this.state.checks;
        checks[key] = !checks[key];
        let newState = { ...this.state, checked, checks };
        this.setState(newState);
        this.props.onSelectLight(event, key);
    }

    updateNameState(event) {
        var name = event.target.value;
        let newState = { ...this.state, name };
        this.setState(newState);
    }

    render() {
        var lights = [];
        for (let key in this.props.lights) {
            lights.push(
                <tr key = { key } >
                    <td className = "leftc">
                        { this.props.lights[key].name }
                    </td>
                    <td className = "rightc">
                        <input
                            type = "checkbox"
                            name = { key }
                            onChange = { (event) => this.updateCBState(event, key) }
                            checked = { this.state.checks[key] }
                        />
                    </td>
                </tr>
            );
        }

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
                        <h3>{ this.props.edit ? "Editing Group" : "New Group" }</h3>
                    </div>
                    <form onSubmit = { (event) => { this.props.onClickSubmit(event) }} >
                        Name: { " " }
                        <input
                            type = "text"
                            value = { this.state.name }
                            placeholder = "e.g Bedroom"
                            onChange = { (event) => this.updateNameState(event) }
                            maxLength = "32"
                        />
                        <div className = "tableWrapper">
                            <table>
                                <tbody>
                                    { lights }
                                </tbody>
                            </table>
                        </div>
                        <input
                            type = "submit"
                            disabled = { !this.validateForm() }
                            className = "roundedButton"
                            value = { this.props.edit ? "Update" : "Create" }
                        />
                    </form>
                </div>
            </div>
        );
    }
}

export {
    GroupForm,
    GroupContainer,
    DeleteGroupContainer
}