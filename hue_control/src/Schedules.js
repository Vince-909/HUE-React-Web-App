import React from "react";
import {
    ColorPicker,
    BriSlider
} from "./Components.js";

class ScheduleContainer extends React.Component {
    
    render() {
        let name =  <b>{ this.props.schedule.name }</b>;
        let richName =  <span>
                            <b>{ this.props.schedule.name + ": " }</b>
                            <i>{ this.props.schedule.description }</i>
                        </span>;
        return(
            <div className = "scheduleContainer">
                <div className = "scheduleIconsWrapper">
                    <input
                        type = "button"
                        className = "scheduleDelete"
                        onClick = { () => this.props.onDelete() }
                    />
                    <input
                        type = "button"
                        className = "scheduleEdit"
                        onClick = { () => this.props.onEdit() }
                    />
                </div>
                <div className = "scheduleDetails">
                    
                    { this.props.schedule.description ? richName : name }
                    <br></br>
                    { this.props.schedule.on ? "Turn on " : "Turn off " }
                    { this.props.resource }
                    <br></br>
                    { this.props.timeInfo.date ? "on " + this.props.timeInfo.date : "every " + this.props.timeInfo.days }
                    <br></br>
                    { "at " + this.props.timeInfo.time }
                    { this.props.timeInfo.rand ? " +- " + this.props.timeInfo.rand : null }
                </div>
            </div>
            );
    }
}

class DeleteScheduleContainer extends React.Component {
    render() {
        let name =  <b>{ this.props.name }</b>;
        let richName =  <span>
                            <b>{ this.props.name + ": " }</b>
                            <i>{ this.props.description }</i>
                        </span>;
        return(
            <div className = "scheduleContainer">
                <div className = "scheduleDetails">
                    <p></p>
                    { this.props.description ? richName : name }
                    <br></br>
                    Are you sure you want to delete this schedule?
                    <br></br>
                    <input
                        type = "button"
                        value = "Yes"
                        className="roundedButton"
                        onClick={ () => this.props.deleteSchedule()}
                    />
                    <input
                        type = "button"
                        value = "No"
                        className="roundedButton"
                        onClick = { () => this.props.cancelDeleteSchedule() }
                    />
                </div>
            </div>
        )
    }
}

class ScheduleForm extends React.Component {

    constructor(props) {
        super(props);
        let name = this.props.edit ? this.props.schedule.name : "";
        let description = this.props.edit ? (this.props.schedule.description ? this.props.schedule.description : "") : "";
        let parsedData = this.props.edit ? this.props.parseTimeInfo(this.props.schedule.when) : {};
        let repeatDays = this.props.edit ? parsedData.selectedDays : [];
        let datetime = this.props.edit ? (parsedData.date ? parsedData.date + "T" + parsedData.time : "") : "";
        let time = this.props.edit ? parsedData.time : "";
        let error = "";
        let rand = { h: 0, m: 0, s: 0 };
        if (this.props.edit && this.props.schedule.when.includes("A")) {
            let randString = this.props.schedule.when.substring(this.props.schedule.when.indexOf("A"));
            let vals = randString.split(":");
            rand.h = vals[0] && isNaN(parseInt(vals[0])) ? 0 : parseInt(vals[0]);
            rand.m = vals[1] && isNaN(parseInt(vals[1])) ? 0 : parseInt(vals[1]);
            rand.s = vals[2] && isNaN(parseInt(vals[2])) ? 0 : parseInt(vals[2]);
        }
        let showCP = false;
        var checkedType = this.props.edit ? this.props.schedule.resourceType : null;
        var checkedKey = this.props.edit ? this.props.schedule.resourceKey : null;
        let bri = this.props.edit ? (this.props.schedule.bri ? this.props.schedule.bri : 256) : 256;
        let defaultColor = { r: 254, g: 210, b: 127, a: 1 };
        if (checkedType && checkedKey) {
            let tempColor = this.props[checkedType][checkedKey].color;
            tempColor = { ...tempColor, a: 1 };
            defaultColor = tempColor;
        }
        let color = this.props.edit ?
                    (this.props.schedule.xy ? this.props.xyToRGB(this.props.schedule.xy, bri) : defaultColor) : defaultColor;
        color = { ...color, a: 1 }
        let xy = this.props.edit ? (this.props.schedule.xy ? this.props.schedule.xy : this.props.RGBToXy(color)) : this.props.RGBToXy(color);
        var action = this.props.edit ? (this.props.schedule.on ? "on" : "off") : null;
        var custom = this.props.edit ? (this.props.schedule.xy ? true : false) : false;
        var repeat = this.props.edit ? (this.props.schedule.when.includes("W") ? true : false) : false;
        this.state = {
            name,
            description, 
            custom,
            repeatDays,
            repeat,
            rand,
            error,
            color,
            showCP,
            xy,
            bri,
            checkedType,
            checkedKey,
            datetime,
            time,
            action
        };
    }

    validateForm() {
        return (this.state.name === "" || !this.state.checkedType
                || !this.state.action || this.state.repeat == null
                || (this.state.repeat == true && (this.state.repeatDays.length == 0 || !this.state.time))
                || (this.state.repeat == false && !this.state.datetime)) ? false : true;
    }

    updateRBState(event, key) {
        let color = this.props[event.target.value][key].color;
        color = { ...color, a: 1 };
        let newState = { ...this.state, checkedType: event.target.value, checkedKey: key, color };
        this.setState(newState);
    }

    updateNameState(event) {
        var name = event.target.value;
        let newState = { ...this.state, name };
        this.setState(newState);
    }

    updateDescriptionState(event) {
        var description = event.target.value;
        let newState = { ...this.state, description };
        this.setState(newState);
    }

    updateActionState(event) {
        var action = event.target.value === "Turn on" ? "on" : "off";
        var custom = this.state.custom;
        if (action === "off") {
            custom = false;
        }
        let newState = { ...this.state, action, custom };
        this.setState(newState);
    }

    updateCustomState(event) {
        var custom = event.target.checked
        let newState = { ...this.state, custom };
        this.setState(newState);
    }

    updateWhenState(event) {
        var repeat = event.target.value === "once" ? false : true;
        let datetime = null;
        let time = null;
        let repeatDays = [];
        let newState = { ...this.state, repeat, repeatDays, datetime, time };
        this.setState(newState);
    }

    updateDatetime(event) {
        let datetime = event.target.value;
        datetime = datetime === "" ? null : datetime;
        let newState = { ...this.state, datetime };
        this.setState(newState);
    }

    updateBri(event) {
        let newState = { ...this.state, bri: event.target.value };
        this.setState(newState);
    }

    updateDays(event) {
        let day = event.target.name;
        let days = [...this.state.repeatDays];
        if (event.target.checked) {
            days.push(day);
        } else {
            days.splice(days.indexOf(day), 1);
        }
        let newState = { ...this.state, repeatDays: days };
        this.setState(newState);
    }

    updateTime(event) {
        let time = event.target.value;
        time = time === "" ? null : time;
        let newState = { ...this.state, time };
        this.setState(newState);
    }

    toggleCP() {
        var showCP = !this.state.showCP;
        let newState = { ...this.state, showCP };
        this.setState(newState);
    }

    dismissCP() {
        let newState = { ...this.state, showCP: false };
        this.setState(newState);
    }

    updateColor(c) {
        var color = { r: c.rgb.r, g: c.rgb.g, b: c.rgb.b, a: 1};
        var xy = this.props.RGBToXy(c.rgb);
        let newState = { ...this.state, color, xy, showCP: false };
        this.setState(newState);
    }

    updateRand(event) {
        let rand = this.state.rand;
        let what = event.target.name;
        let value = event.target.value;
        let parsedValue = parseInt(value);
        if (isNaN(parsedValue) || parsedValue < 0 || parsedValue > 59) {
            parsedValue = 0;
        }
        if (parsedValue > 23 && what === "h") {
            parsedValue = 0;
        }
        rand[what] = parsedValue;
        let newState = { ...this.state, rand };
        this.setState(newState);
    }

    prepareSubmit(event) {
        event.preventDefault();
        let rand = this.state.rand;
        let randString = "";
        if (rand.h !== 0 || rand.m !== 0 || rand.s !== 0) {
            randString += "A";
            if (rand.h < 10) {
                randString += "0";
            }
            randString += rand.h;
            randString += ":";
            if (rand.m < 10) {
                randString += "0";
            }
            randString += rand.m;
            randString += ":";
            if (rand.s < 10) {
                randString += "0"
            }
            randString += rand.s;
        }
        if (this.state.repeat) {
            let time = this.state.time;
            time += randString;
            let mask = 0;
            let days = this.state.repeatDays;
            if (days.includes("Mon")) {
                mask += 64;
            }
            if (days.includes("Tue")) {
                mask += 32;
            }
            if (days.includes("Wed")) {
                mask += 16;
            }
            if (days.includes("Thu")) {
                mask += 8;
            }
            if (days.includes("Fri")) {
                mask += 4;
            }
            if (days.includes("Sat")) {
                mask += 2;
            }
            if (days.includes("Sun")) {
                mask += 1;
            }
            time = "W" + mask + "/T" + time;
            var finalWhen = time;
        } else {
            var finalWhen = this.state.datetime + randString;
        }
        this.createSchedule(finalWhen);
    }

    async createSchedule(finalWhen) {
        var body = {};
        var command = {};
        command.address = "/api/" + this.props.token + "/" + this.state.checkedType + "/" + this.state.checkedKey + "/";
        command.address = this.state.checkedType === "groups" ? command.address + "action" : command.address + "state";
        command.method = "PUT";
        body.on = this.state.action === "on" ? true : false;
        if (this.state.custom) {
            body.bri = parseInt(this.state.bri);
            body.xy = this.state.xy;
        }
        command.body = body;
        var schedule = {};
        schedule.name = this.state.name;
        schedule.description = this.state.description;
        schedule.command = command;
        schedule.localtime = finalWhen;
        let method = this.props.edit ? "PUT" : "POST";
        let index = "";
        if ( this.props.edit && this.props.editKey) {
            index += ("/" + this.props.editKey);
        }
        var res = await fetch("http://" + this.props.ip +
                                "/api/" + this.props.token + "/schedules" + index, {
                                                                            method,
                                                                            headers: {
                                                                                'Content-Type': 'application/json'
                                                                            },
                                                                            body: JSON.stringify(schedule)
                                });
                                
        let result = (await res.json())[0];
        let error = false;
        for (let k in result) {
            if (k === "error") {
                error = true;
                let newState = { ...this.state, error: result[k].description };
                this.setState(newState);
            }
        }
        if (!error) {
            this.props.finish();
        }
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
                            type = "radio"
                            name = "resource"
                            value = { "lights" }
                            checked = { (this.state.checkedType === "lights" && this.state.checkedKey === key) ? true : false }
                            onChange = { (event) => this.updateRBState(event, key) }
                        />
                    </td>
                </tr>
            );
        }
        var groups = [];
        for (let key in this.props.groups) {
            groups.push(
                <tr key = { key } >
                    <td className = "leftc">
                        { this.props.groups[key].name }
                    </td>
                    <td className = "rightc">
                        <input
                            type = "radio"
                            name = "resource"
                            value = { "groups" }
                            checked = { (this.state.checkedType === "groups" && this.state.checkedKey === key) ? true : false }
                            onChange = { (event) => this.updateRBState(event, key) }
                        />
                    </td>
                </tr>
            );
        }
        var customise = <tr>
                            <td className = "leftc">
                                { "customise: " }
                            </td>
                            <td className = "rightc">
                                <input
                                    type = "checkbox"
                                    name = "customise"
                                    checked = { this.state.custom }
                                    onChange = { (event) => this.updateCustomState(event) }
                                />
                            </td>
                        </tr>;
        var customisers =  <tr>
                                <td className = "leftc">
                                    <ColorPicker
                                        color = { this.state.color }
                                        showCP = { this.state.showCP }
                                        onColorPickerClick = { () => this.toggleCP() }
                                        dismissCP = { () => this.dismissCP() }
                                        onChange = { (c) => this.updateColor(c) }
                                    />
                                </td>
                                <td className = "rightc">
                                    <BriSlider
                                        bri = { this.state.bri }
                                        onChange = { (event) => this.updateBri(event) }
                                    />
                                </td>
                            </tr>
        var datetime =  <div>
                            <input
                                type = "datetime-local"
                                step = "1"
                                value = { this.state.datetime }
                                onChange = { (event) => this.updateDatetime(event) }
                            />
                        </div>;
        var daysOfWeek =    <div className = "tableWrapper">
                                <table>
                                    <tbody>
                                    <tr>
                                        <td>Mon</td>
                                        <td>Tue</td>                                         
                                        <td>Wed</td>
                                        <td>Thu</td>
                                        <td>Fri</td>
                                        <td>Sat</td>
                                        <td>Sun</td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <input
                                                type = "checkbox"
                                                name = "Mon"
                                                checked = { this.state.repeatDays.includes("Mon") }
                                                onChange = { (event) => this.updateDays(event) }
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type = "checkbox"
                                                name = "Tue"
                                                checked = { this.state.repeatDays.includes("Tue") }
                                                onChange = { (event) => this.updateDays(event) }
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type = "checkbox"
                                                name = "Wed"
                                                checked = { this.state.repeatDays.includes("Wed") }
                                                onChange = { (event) => this.updateDays(event) }
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type = "checkbox"
                                                name = "Thu"
                                                checked = { this.state.repeatDays.includes("Thu") }
                                                onChange = { (event) => this.updateDays(event) }
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type = "checkbox"
                                                name = "Fri"
                                                checked = { this.state.repeatDays.includes("Fri") }
                                                onChange = { (event) => this.updateDays(event) }
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type = "checkbox"
                                                name = "Sat"
                                                checked = { this.state.repeatDays.includes("Sat") }
                                                onChange = { (event) => this.updateDays(event) }
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type = "checkbox"
                                                name = "Sun"
                                                checked = { this.state.repeatDays.includes("Sun") }
                                                onChange = { (event) => this.updateDays(event) }
                                            />
                                        </td>
                                    </tr>
                                    </tbody>
                                </table>
                                <input
                                    type = "time"
                                    name = "time"
                                    step = "1"
                                    value = { this.state.time }
                                    onChange = { (event) => this.updateTime(event) }
                                />
                            </div>;

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
                        <h3>{ this.props.edit ? "Editing Schedule" : "New Schedule" }</h3>
                    </div>
                    <form onSubmit = { (event) => { this.prepareSubmit(event) }} >
                        <table>
                            <tbody>
                                <tr>
                                    <td className = "leftc">
                                        Name: { " " }
                                    </td>
                                    <td className = "rightc">
                                        <input
                                            type = "text"
                                            name = "newName"
                                            value = { this.state.name }
                                            placeholder = "e.g Alarm"
                                            onChange = { (event) => this.updateNameState(event) }
                                            maxLength = "32"
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td className = "leftc">
                                        Description: { " " }
                                    </td>
                                    <td className = "rightc">
                                        <input
                                            type = "text"
                                            name = "newDescription"
                                            value = { this.state.description }
                                            placeholder = "e.g My wake up alarm"
                                            onChange = { (event) => this.updateDescriptionState(event) }
                                            maxLength = "64"
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td colSpan = "2">
                                        Resource: { " " }
                                    </td>
                                </tr>
                                    { lights }
                                    { groups }
                                <tr>
                                    <td className = "leftc" rowSpan = "2">
                                        Action: { " " }
                                    </td>
                                    <td className = "rightc">
                                        <input
                                            type = "radio"
                                            name = "action"
                                            value = { "Turn on" }
                                            checked = { this.state.action === "on" }
                                            onChange = { (event) => this.updateActionState(event) }
                                        />
                                        { "turn on" }
                                    </td>
                                </tr>
                                <tr>
                                    <td className = "rightc">
                                        <input
                                            type = "radio"
                                            name = "action"
                                            value = { "Turn off" }
                                            checked = { this.state.action === "off" }
                                            onChange = { (event) => this.updateActionState(event) }
                                        />
                                        { "turn off" }
                                    </td>
                                </tr>
                                { this.state.action === "on" ? customise : null }
                                { this.state.custom ? customisers : null }
                                <tr>
                                    <td className = "leftc" rowSpan = "2">
                                        Run the task: { " " }
                                    </td>
                                    <td className = "rightc">
                                        <input
                                            type = "radio"
                                            name = "when"
                                            value = { "once" }
                                            checked = { !this.state.repeat ? true : false }
                                            onChange = { (event) => this.updateWhenState(event) }
                                        />
                                        { "once" }
                                    </td>
                                </tr>
                                <tr>
                                    <td className = "rightc">
                                        <input
                                            type = "radio"
                                            name = "when"
                                            checked = { this.state.repeat ? true : false }
                                            value = { "repeatedly" }
                                            onChange = { (event) => this.updateWhenState(event) }
                                        />
                                        { "repeatedly" }
                                    </td>
                                </tr>
                                <tr>
                                    <td colSpan = "2">
                                    { this.state.repeat == null ? null : (this.state.repeat == false ? datetime : daysOfWeek) }
                                    </td>
                                </tr>
                                <tr>
                                    <td className = "leftc">
                                        Randomise time by +/- : {" "}
                                    </td>
                                    <td className = "rightc">
                                        <input
                                            type = "number"
                                            min = "0"
                                            max = "23"
                                            name = "h"
                                            value = { this.state.rand.h }
                                            onChange = { (event) => this.updateRand(event) }
                                        />
                                        { "h " }
                                        <input
                                            type = "number"
                                            min = "0"
                                            max = "59"
                                            width = "20px"
                                            name = "m"
                                            value = { this.state.rand.m }
                                            onChange = { (event) => this.updateRand(event) }
                                        />
                                        { "m " }
                                        <input
                                            type = "number"
                                            min = "0"
                                            max = "59"
                                            width = "20px"
                                            name = "s"
                                            value = { this.state.rand.s }
                                            onChange = { (event) => this.updateRand(event) }
                                        />
                                        s
                                    </td>
                                </tr>
                                <tr>
                                    <td colSpan = "2">
                                        <input
                                            type = "submit"
                                            disabled = { !this.validateForm() }
                                            className = "roundedButton"
                                            value = { this.props.edit ? "Update" : "Create" }
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td colSpan = "2" className = "scheduleError">
                                        { this.state.error }
                                    </td>
                                </tr>
                            </tbody>
                        </table>           

                    </form>
                </div>
            </div>
        );
    }
}

export {
    ScheduleForm,
    ScheduleContainer,
    DeleteScheduleContainer
}