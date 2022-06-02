import "./App.css";
import React from "react";
import {
    NavBar
} from "./Components.js";
import {
    ConfigurationForm,
    TokenForm,
    TokenNote,
    ResetConfigForm
} from "./Configuration.js";
import {
    GroupForm,
    GroupContainer,
    DeleteGroupContainer
} from "./Groups.js";
import {
    LightContainer,
    LightForm
} from "./Lights.js";
import {
    ScheduleForm,
    ScheduleContainer,
    DeleteScheduleContainer
} from "./Schedules.js";
import Cookies from "universal-cookie";

class App extends React.Component {

    constructor(props) {
        super(props);
        let cookieDate = new Date();
        cookieDate.setDate((cookieDate.getDate() + 30));
        const cookies = new Cookies();
        let lastMainView = cookies.get("lastMainView");
        if (!lastMainView) {
            lastMainView = "lights"
            cookies.set("lastMainView", lastMainView, { expires: cookieDate });
        }
        let ip = cookies.get("bridgeIP");
        if (ip) {
            let result = this.tryIP(ip);
            if (result === "error") {
                ip = null;
            }
        }
        let token = cookies.get("token");
        this.state = { ip, token, view: lastMainView, lastMainView, showNote: false };
    }

    xyToRGB(xy, bri) {

        let x = parseFloat(xy[0]);
        let y = parseFloat(xy[1]);
        let z = 1.0 - x - y;
        let Y = bri;
        let X = (Y / y) * x;
        let Z = (Y / y) * z;
    
    
        let r =  X * 1.656492 - Y * 0.354851 - Z * 0.255038;
        let g = -X * 0.707196 + Y * 1.655397 + Z * 0.036152;
        let b =  X * 0.051713 - Y * 0.121364 + Z * 1.011530;
    
        if (r > b && r > g && r > 1.0) {
            g = g / r;
            b = b / r;
            r = 1.0;
        }
        else if (g > b && g > r && g > 1.0) {
            r = r / g;
            b = b / g;
            g = 1.0;
        }
        else if (b > r && b > g && b > 1.0) {
            r = r / b;
            g = g / b;
            b = 1.0;
        }
    
        r = r <= 0.0031308 ? 12.92 * r : (1.0 + 0.055) * Math.pow(r, (1.0 / 2.4)) - 0.055;
        g = g <= 0.0031308 ? 12.92 * g : (1.0 + 0.055) * Math.pow(g, (1.0 / 2.4)) - 0.055;
        b = b <= 0.0031308 ? 12.92 * b : (1.0 + 0.055) * Math.pow(b, (1.0 / 2.4)) - 0.055;
    
        r *= 255;
        g *= 255;
        b *= 255;
    
        return { r, g, b };
    }
    
    RGBToXy(rgb) {
        let red = rgb.r / 255.0
        let green = rgb.g / 255.0
        let blue = rgb.b / 255.0
    
        red = (red > 0.04045) ? Math.pow((red + 0.055) / (1.0 + 0.055), 2.4) : (red / 12.92);
        green = (green > 0.04045) ? Math.pow((green + 0.055) / (1.0 + 0.055), 2.4) : (green / 12.92);
        blue = (blue > 0.04045) ? Math.pow((blue + 0.055) / (1.0 + 0.055), 2.4) : (blue / 12.92);
    
        let X = red * 0.664511 + green * 0.154324 + blue * 0.162028;
        let Y = red * 0.283881 + green * 0.668433 + blue * 0.047685;
        let Z = red * 0.000088 + green * 0.072310 + blue * 0.986039;
    
        let x = X / (X + Y + Z);
        let y = Y / (X + Y + Z);
    
        return [x, y]
    }

    //Parse the schedule string
    parseTimeInfo(string) {
        var date = null;
        var selectedDays = [];
        if (string.startsWith("W")) {
            var mask = parseInt(string.substring(1, 4));
            let days = [ "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun" ];
            for (let i = 6 ; i >= 0 ; i --) {
                let temp = Math.pow(2, i);
                if (temp <= mask) {
                    selectedDays.push(days[days.length - 1 - i])
                    mask -= temp;
                    if (mask === 0) {
                        break;
                    }
                }
            }
            var daysString = "";
            for (let i of selectedDays) {
                daysString += (i + ", ");
            }
            daysString = daysString.substring(0, daysString.length - 2);
        } else if (!string.includes("PT")) {
            date = string.substring(0, 10);
        }
        var pureTime = string.substring(string.indexOf("T") + 1, string.indexOf("T") + 1 + 8);
        let Aindex = string.indexOf("A");
        var rand = Aindex === -1 ? null : string.substring(Aindex + 1, Aindex + 1 + 8);
        var result = {
            days: daysString,
            selectedDays,
            date,
            rand,
            time: pureTime
        }
        return(result);
    }

    //Test suggested bridge IP
    async tryIP(ip) {
        var result;
        try {
            result = await fetch("http://" + ip + "/api/0/config", { method: "GET" });
        } catch(error) {
            result = "error";
        }
        if (result !== "error") {
          if (result.ok && result.status === 200) {
              return ip;
          }
        }
        return "error";
    }

    //Save bridge IP
    async setBridgeIP(ip) {
        let newState = { ...this.state, ip };
        let cookieDate = new Date();
        cookieDate.setDate((cookieDate.getDate() + 30));
        this.setState(newState);
        const cookies = new Cookies();
        cookies.set("bridgeIP", ip, { expires: cookieDate });
        if (this.state.ip && this.state.token) {
            this.load();
        }
    }

    //Save the developer token
    async setToken(token, isNew) {
        const cookies = new Cookies();
        let cookieDate = new Date();
        cookieDate.setDate((cookieDate.getDate() + 30));
        cookies.set("token", token, { expires: cookieDate });
        let newState = { ...this.state, token, showNote: isNew };
        this.setState(newState);
        if (this.state.ip && this.state.token) {
            this.load();
        }
    }

    //Produce a new developer token (requires bridge link button to be pressed)
    async createNewToken() {
        let newState = { locked: !this.state.locked };
        this.setState( newState );
        let body = {
            devicetype: "HueReactWebApp"
        }
        let result = await fetch("http://" + this.state.ip + "/api",
        {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        result = (await result.json())[0];
        let fail = false;
        let desc = ""
        for (let keys in result) {
            if (keys === "error") {
                fail = true;
                desc = result[keys].description;
            } else if (keys === "success")
                desc = result[keys].username;
        }
        if (fail) {
            return ("error: " + desc);
        } else {
            return (desc);
        }
    }

    componentDidMount() {
        if (this.state.token && this.state.ip) {
            this.load();
        }
    }

    disableNote() {
        let newState = { ...this.state, showNote: false };
        this.setState(newState);
    }

    //Delete a light group from the bridge
    deleteGroupHandler(key) {
        let temp = { ...this.state.group };
        temp[key].mode = "delete";
        this.setState({ ...this.state, group: temp });
    }

    //Delete a scheduled event from the bridge
    deleteScheduleHandler(key) {
        let temp = { ...this.state.schedule };
        temp[key].mode = "delete";
        this.setState({ ...this.state, schedule: temp });
    }

    //Toggles a light resource
    async toggleSwitch(key, isGroup) {
        let temp = isGroup ? { ...this.state.group } : { ...this.state.light };
        temp[key].on  = isGroup ? !this.state.group[key].on : !this.state.light[key].on;
        var body = {
            on: temp[key].on
        }
        let urlPart1 = isGroup ? "/groups/" : "/lights/";
        let urlPart2 = isGroup ? "/action" : "/state";
        await fetch("http://" + this.state.ip + "/api/" + this.state.token + urlPart1 + key + urlPart2,
        {
            method: "PUT",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        if (isGroup) {
            this.setState({ ...this.state, group: temp });
        } else {
            this.setState({ ...this.state, light: temp });
        }
        await this.load();
    }

    editHandler(key) {
        this.setState({ ...this.state, view: "editingLight", editingLight: key });
    }

    //Change a resource light color
    async updateColor(c, key, isGroup) {    
        let temp = isGroup ? { ...this.state.group } : { ...this.state.light };
        temp[key].color = { r: c.rgb.r, g: c.rgb.g, b: c.rgb.b, a: 1};
        temp[key].on = true;
        var body = {
          xy: this.RGBToXy(c.rgb),
          on: true
        }
        let urlPart1 = isGroup ? "/groups/" : "/lights/";
        let urlPart2 = isGroup ? "/action" : "/state";
        await fetch("http://" + this.state.ip + "/api/" + this.state.token + urlPart1 + key + urlPart2,
        {
            method: "PUT",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        if (isGroup) {
            this.setState({ ...this.state, group: temp });
        } else {
            this.setState({ ...this.state, light: temp });
        }
        await this.load();
    }
    
    dismissCP(key, isGroup) {
        let temp = isGroup ? { ...this.state.group } : { ...this.state.light };
        temp[key].showCP = false;
        if (isGroup) {
            this.setState({ ...this.state, group: temp });
        } else {
            this.setState({ ...this.state, light: temp });
        }
    }

    toggleCP(key, isGroup) {
        let temp = isGroup ? { ...this.state.group } : { ...this.state.light };
        temp[key].showCP = !temp[key].showCP;
        if (isGroup) {
            this.setState({ ...this.state, group: temp });
        } else {
            this.setState({ ...this.state, light: temp });
        }
    }

    //Throttle updates to the bridge when using the brightness slider
    async throttleUpdateBri(b, key, isGroup) {
        let temp = isGroup ? { ...this.state.group } : { ...this.state.light };
        let throt = isGroup ? 1000 : 300;
        if (temp[key].cachedBri == -1) {
            setTimeout(() => { this.updateBri(key, isGroup) }, throt);
        }
        temp[key].cachedBri = parseInt(b);
        if (isGroup) {
            this.setState({ ...this.state, group: temp });
        } else {
            this.setState({ ...this.state, light: temp });
        }
    }

    //Change a resource brightness
    async updateBri(key, isGroup) {
        let temp = isGroup ? { ...this.state.group } : { ...this.state.light };
        temp[key].on = true;
        temp[key].bri = temp[key].cachedBri;
        temp[key].cachedBri = -1;
        let bri = temp[key].bri === 0 ? 1 : temp[key].bri;
        var body = {
          on: true,
          bri: parseInt(bri)
        }
        let urlPart1 = isGroup ? "/groups/" : "/lights/";
        let urlPart2 = isGroup ? "/action" : "/state";
        await fetch("http://" + this.state.ip + "/api/" + this.state.token + urlPart1 + key + urlPart2,
        {
            method: "PUT",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        if (isGroup) {
            this.setState({ ...this.state, group: temp });
        } else {
            this.setState({ ...this.state, light: temp });
        }
        await this.load();
    }

    cancelDeleteGroup(key) {
        let temp = { ...this.state.group };
        temp[key].mode = "normal";
        this.setState({ ...this.state, group: temp });
    }

    cancelDeleteSchedule(key) {
        let temp = { ...this.state.schedule };
        temp[key].mode = "normal";
        this.setState({ ...this.state, schedule: temp });
    }

    createGroupHandler(edit, key) {
        if (!edit) {
            this.setState({ ...this.state, view: "creatingGroup" });
        } else {
            this.setState({ ...this.state, view: "editingGroup", editingGroup: key });
        } 
    }

    createScheduleHandler(edit, key) {
        if (!edit) {
            this.setState({ ...this.state, view: "creatingSchedule" });
        } else {
            this.setState({ ...this.state, view: "editingSchedule", editingSchedule: key });
        }  
    }

    //Reset the stored IP and developer token from the bridge
    resetConfig() {
        let ip = null;
        let token = null;
        const cookies = new Cookies();
        cookies.remove("lastMainView");
        cookies.remove("bridgeIP");
        cookies.remove("token");
        let newState = { ...this.state, ip, token, lastMainView: "lights", view: "lights" };
        this.setState(newState);
    }

    //Delete a light group form the bridge
    async deleteGroup(key) {
        let temp = { ...this.state.group };
        var res = await fetch("http://" + this.state.ip +
                              "/api/" + this.state.token + "/groups/" +
                              key,
        {
            method: "DELETE",
            headers: {
                'Content-Type': 'application/json'
            },
        });
        res = (await res.json())[0];
        let success = false;
        for (let keys in res) {
            if (keys === "success") {
                success = true;
            }
        }
        if (success) {
            delete temp[key];
        } else {
            temp[key].mode = "normal";
        }
        this.setState({ ...this.state, group: temp });
    }

    //Delete a schedule from the bridge
    async deleteSchedule(key) {
        let temp = { ...this.state.schedule };
        var res = await fetch("http://" + this.state.ip +
                              "/api/" + this.state.token + "/schedules/" +
                              key,
        {
            method: "DELETE",
            headers: {
                'Content-Type': 'application/json'
            },
        });
        res = (await res.json())[0];
        let success = false;
        for (let keys in res) {
            if (keys === "success") {
                success = true;
            }
        }
        if (success) {
            delete temp[key];
        } else {
            temp[key].mode = "normal";
        }
        this.setState({ ...this.state, schedule: temp });
    }

    expandGroup(key) {
        let oldGroup = { ...this.state.group };
        oldGroup[key].expanded = !oldGroup[key].expanded;
        let newState = { ...this.state, group: oldGroup };
        this.setState( newState );
    }

    async blinkLight(key) {
        let result = await fetch("http://" + this.state.ip + "/api/" + this.state.token + "/lights/" + key,
                                {method: "GET"});
        result = (await result.json()).state.on;
        var body = {
          on: !result,
          transitiontime: 0
        }
        await fetch("http://" + this.state.ip + "/api/" + this.state.token + "/lights/" + key + "/state",
        {
            method: "PUT",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
    }

    async selectLightHandler(value, key) {
        if (!value) {
            return;
        }
        await this.blinkLight(key);
        setTimeout(() => { this.blinkLight(key) }, 1000);
    }

    goToNormal() {
        let newState = {...this.state, view: this.state.lastMainView };
        if (newState.editingGroup) {
            delete newState.editingGroup;
        }
        if (newState.editingLight) {
            delete newState.editingLight;
        }
        this.setState(newState);
        this.load();
    }

    async updateLightName(event) {
        event.preventDefault();
        let body = {
            name: event.target.newName.value
        }
        var res = await fetch("http://" + this.state.ip +
        "/api/" + this.state.token + "/lights/" + this.state.editingLight,
        {
          method: "PUT",
          headers: {
                  'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        });
        res = (await res.json())[0];
        let success = false;
        for (let keys in res) {
            if (keys === "success") {
                success = true;
            }
        }
        if (this.state.editingGroup) {
            delete this.state.editingGroup;
        }
        if (success) {
            this.load();
        }
        if (this.state.editingLight) {
            delete this.state.editingLight;
        }
    }

    switchViewHandler(mode) {
        if ((mode === this.state.lastMainView) && (mode === this.state.view)) {
            return;
        }
        if (mode !== "reset") {
            var lastMainView = mode;
        } else {
            var lastMainView = this.state.lastMainView;
        }
        let newState = { ...this.state, view: mode, lastMainView };
        let cookieDate = new Date();
        cookieDate.setDate((cookieDate.getDate() + 30));
        const cookies = new Cookies();
        if (mode !== "reset") {
            cookies.set("lastMainView", mode, { date: cookieDate });
        }
        
        this.setState(newState);
    }

    //Create a new light group
    async createGroup(event, edit) {
        
        event.preventDefault();
        let editingGroup = "";
        let method = "POST";
        if (edit) {
            method = "PUT";
            editingGroup += "/";
            editingGroup += this.state.editingGroup;
        }
        let name = "";
        let lights = [];
        for (let item of event.target.elements) {
            if (item.type === "checkbox" && item.checked === true) {
                lights.push(item.name);
            } else if (item.type === "text") {
                name = item.value;
            }
        }
        let body = {
            name,
            lights
        }
        var res = await fetch("http://" + this.state.ip +
        "/api/" + this.state.token + "/groups" + editingGroup,
        {
          method,
          headers: {
                  'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        });
        res = (await res.json())[0];
        let success = false;
        for (let keys in res) {
            if (keys === "success") {
                success = true;
            }
        }
        if (this.state.editingGroup) {
            delete this.state.editingGroup;
        }
        if (success) {
            this.load();
        }
    }

    //Update the control panel
    async load() {
        let response = await fetch("http://" + this.state.ip + "/api/" + this.state.token + "/groups/", { method: "GET" });
        response = await response.json();
        let group = {};
        if (JSON.stringify(response) !== '{}') {
            for (let key in response) {
                if ((response[key].type !== "LightGroup") && (response[key].type !== "Room")) {
                    continue;
                }
                let rgb = this.xyToRGB(response[key].action.xy, response[key].action.bri);
                let brimod = response[key].action.bri % 23;
                let bri;
                if (brimod === 0 || (brimod >= 13 && brimod <= 22)) {
                    if (brimod === 0) {
                        bri = response[key].action.bri + 1;
                    } else {
                        bri = response[key].action.bri + (23 - brimod + 1);
                    }
                } else {
                    bri = response[key].action.bri - (brimod - 1);
                }
                let lights = [];
                for (let c of response[key].lights) {
                    lights.push(parseInt(c));
                }
                let expanded = this.state.group ? (this.state.group[key] ? this.state.group[key].expanded : false ) : false;
                let child = {
                    mode: "normal",
                    name: response[key].name,
                    on: response[key].action.on,
                    showCP: false,
                    color: { r: rgb.r, g: rgb.g, b: rgb.b, a: 1 },
                    bri: parseInt(bri),
                    cachedBri: parseInt(-1),
                    lights,
                    expanded
                }
                group = { ...group, [key]: child };
            }
        }
        let newState = { ...this.state, view: this.state.lastMainView, group };
        response = await fetch("http://" + this.state.ip + "/api/" + this.state.token + "/lights/", { method: "GET" });
        response = await response.json();
        let light = {};
        if (JSON.stringify(response) !== '{}') {
            for (let key in response) {
                let bri;
                let brimod = response[key].state.bri % 23;
                if (brimod === 0 || (brimod >= 13 && brimod <= 22)) {
                    if (brimod === 0) {
                        bri = response[key].state.bri + 1;
                    } else {
                        bri = response[key].state.bri + (23 - brimod + 1);
                    }
                } else {
                    bri = response[key].state.bri - (brimod - 1);
                }
                let rgb = this.xyToRGB(response[key].state.xy, response[key].state.bri);
                let child = {
                    name: response[key].name,
                    on: response[key].state.on,
                    showCP: false,
                    bri: parseInt(bri),
                    cachedBri: -1,
                    color: { r: rgb.r, g: rgb.g, b: rgb.b, a: 1 },
                }
                light = { ...light, [key]: child };
            }
            newState = { ...newState, light };
        }
        response = await fetch("http://" + this.state.ip + "/api/" + this.state.token + "/schedules/", { method: "GET" });
        response = await response.json();
        let schedule = {};
        if (JSON.stringify(response) !== '{}') {
            for (let key in response) {
                let resource = response[key].command.address.split("/");
                let resourceType = resource[resource.length - 3];
                if (resourceType !== "groups" && resourceType !== "lights") {
                    continue;
                }
                let resourceKey = resource[resource.length - 2];
                let child = {
                    name: response[key].name,
                    mode: "normal",
                    description: response[key].description === "" ? null : response[key].description,
                    on: response[key].command.body.on,
                    bri: response[key].command.body.bri,
                    xy: response[key].command.body.xy,
                    when: response[key].localtime ? response[key].localtime : response[key].time,
                    status: response[key].status,
                    resourceType,
                    resourceKey
                }
                schedule = { ...schedule, [key]: child };
            }
            newState = { ...newState, schedule };
        }
        this.setState(newState);
    }

    renderGroupContainer(key) {
            var dc =    <DeleteGroupContainer
                            mkey = { key }
                            cancelDeleteGroup = { () => this.cancelDeleteGroup(key) }
                            deleteGroup = { () => this.deleteGroup(key) }
                            name = { this.state.group[key].name }
                        />
            var ei =    <div className = "expandContainer">
                            <input
                                type = "button"
                                className = { this.state.group[key].expanded ? "collapseIcon" : "expandIcon" }
                                onClick = { () => this.expandGroup(key) }
                            />
                        </div>
            var gc =    <GroupContainer
                            mkey = { key }
                            createGroupHandler = { () => this.createGroupHandler(true, key) }
                            deleteGroupHandler = { () => this.deleteGroupHandler(key) }
                            name = {this.state.group[key].name }
                            on = { this.state.group[key].on }
                            color = { this.state.group[key].color }
                            toggle = { () => this.toggleSwitch(key, true) }
                            showCP = { this.state.group[key].showCP }
                            toggleCP = { () => this.toggleCP(key, true) }
                            dismissCP = { () => this.dismissCP(key, true) }
                            updateColor = { (c) => this.updateColor(c, key, true) }
                            bri = { this.state.group[key].bri }
                            cachedBri = { this.state.group[key].cachedBri }
                            updateBri = { (event) => this.throttleUpdateBri(event.target.value, key, true) }
                        />
            let lightContainers = [];
            for (let k in this.state.light) {
                if (this.state.group[key].lights.includes(parseInt(k))) {
                    let lc =    <LightContainer
                                    key = { k }
                                    editHandler = { () => this.editHandler(k) }
                                    name = { this.state.light[k].name }
                                    on = { this.state.light[k].on }
                                    color = { this.state.light[k].color }
                                    showCP = { this.state.light[k].showCP }
                                    bri = { this.state.light[k].bri }
                                    cachedBri = { this.state.light[k].cachedBri }
                                    dismissCP = { () => this.dismissCP(k, false) }
                                    toggle = { () => this.toggleSwitch(k, false) }
                                    toggleCP = { () => this.toggleCP(k, false) }
                                    updateColor = { (c) => this.updateColor(c, k, false) }
                                    updateBri = { (event) => this.throttleUpdateBri(event.target.value, k, false) }

                                />
                    lightContainers.push(lc);
                }
            }
            return(
                <div className = "toolContainer"  key = { key } >
                    { (this.state.group[key].mode === "normal") ? gc : null }
                    { ((this.state.group[key].mode === "normal") && (this.state.group[key].expanded)) ? "_____________________" : null }
                    { ((this.state.group[key].mode === "normal") && (this.state.group[key].expanded)) ? lightContainers : null }
                    { (this.state.group[key].mode === "normal") ? ei : null }
                    { (this.state.group[key].mode === "delete") ? dc : null }
                </div>
            );       
    }

    renderLightContainer(k) {
        let lc =    <LightContainer
                        key = { k }
                        editHandler = { () => this.editHandler(k) }
                        name = { this.state.light[k].name }
                        on = { this.state.light[k].on }
                        color = { this.state.light[k].color }
                        showCP = { this.state.light[k].showCP }
                        bri = { this.state.light[k].bri }
                        cachedBri = { this.state.light[k].cachedBri }
                        dismissCP = { () => this.dismissCP(k, false) }
                        toggle = { () => this.toggleSwitch(k, false) }
                        toggleCP = { () => this.toggleCP(k, false) }
                        updateColor = { (c) => this.updateColor(c, k, false) }
                        updateBri = { (event) => this.throttleUpdateBri(event.target.value, k, false) }

                    />
        return(
            <div className = "toolContainer"  key = { k } >
                { lc }
            </div>
        );       
    }

    renderSchedule(key) {
        let schedule = this.state.schedule[key];
        let timeInfo = this.parseTimeInfo(schedule.when);
        let resource = schedule.resourceType === "groups" ? this.state.group[schedule.resourceKey].name : this.state.light[schedule.resourceKey].name;
        let sch =   <ScheduleContainer
                        onDelete = { () => this.deleteScheduleHandler(key) }
                        onEdit = { () => this.createScheduleHandler(true, key) }
                        key = { key }
                        schedule = { schedule }
                        timeInfo = { timeInfo }
                        resource = { resource }
                    />;
        let delSch =    <DeleteScheduleContainer
                            key = { key }
                            name = { schedule.name }
                            description = { schedule.description }
                            deleteSchedule = { () => this.deleteSchedule(key) }
                            cancelDeleteSchedule = { () => this.cancelDeleteSchedule(key) }
                        />
        return(
            schedule.mode === "normal" ? sch : delSch
        );
    }

    createResetView() {
        return(
            <div className="App">
                <NavBar
                    view = { this.state.view }
                    clickHandler = { (mode) => this.switchViewHandler(mode) }
                />
                <div className="appTitle">
                    Configuration
                </div>
                <ResetConfigForm
                    reset = { () => this.resetConfig() }
                    ip = { this.state.ip }
                    token = { this.state.token }
                    onClickBack = { () => this.goToNormal() }
                />
            </div>
        );
    }

    createScheduleView() {
        var schedules = [];
        for (let key in this.state.schedule) {
            schedules.push(this.renderSchedule(key));
        }
        return(
            <div className="App">
                <NavBar
                    view = { this.state.lastMainView }
                    clickHandler = { (mode) => this.switchViewHandler(mode) }
                />
                <div className="appTitle">
                    Schedules
                </div>
                { schedules }
                <div className="scheduleContainer">
                    <input
                        type = "button"
                        className = "addSchedule"
                        value = "+"
                        onClick = { () => this.createScheduleHandler(false) }
                    />
                </div>
            </div>
        );       
    }

    createGroupView() {
        var containers = [];
        for (let key in this.state.group) {
            containers.push(this.renderGroupContainer(key));
        }
        return(
            <div className="App">
                <NavBar
                    view = { this.state.lastMainView }
                    clickHandler = { (mode) => this.switchViewHandler(mode) }
                />
                <div className="appTitle">
                    Light Groups
                </div>
                { containers }
                <div className="toolContainer">
                    <input
                        type = "button"
                        className = "add"
                        value = "+"
                        onClick = { () => this.createGroupHandler(false) }
                    />
                </div>
            </div>
        );    
    }

    createLightView() {
        var containers = [];
        for (let key in this.state.light) {
            containers.push(this.renderLightContainer(key));
        }
        return(
            <div className="App">
                <NavBar
                    view = { this.state.lastMainView }
                    clickHandler = { (mode) => this.switchViewHandler(mode) }
                />
                <div className="appTitle">
                    Lights
                </div>
                { containers }
            </div>
        );    
    }

    createConfigureIPView() {
        return(
          <div className = "App">
            <div className="appTitle">
                Bridge Discovery
            </div>
            <ConfigurationForm
                submitHandler = { (ip) => this.tryIP(ip) }
                setBridgeIP = { (ip) => this.setBridgeIP(ip) }
            />
          </div>
        );
    }

    createGroupSetupView(edit) {
        window.scrollTo(0, 0);
        return(
            <div className= "App" >
                <NavBar
                    view = { this.state.view }
                    clickHandler = { (mode) => this.switchViewHandler(mode) }
                />
                <div className = "appTitle">
                    Light Groups
                </div>
                <GroupForm
                    lights = { this.state.light }
                    edit = { edit }
                    activeLights = { edit ? this.state.group[parseInt(this.state.editingGroup)].lights : [] }
                    editName = { edit ? this.state.group[parseInt(this.state.editingGroup)].name : "" }
                    onSelectLight = { (event, key) => this.selectLightHandler(event.target.checked, key) }
                    onClickSubmit = { (event) =>  this.createGroup(event, edit) }
                    onClickBack = { () => this.goToNormal() }
                />
            </div>
        );
    }

    createScheduleSetupView(edit) {
        window.scrollTo(0, 0);
        return(
            <div className= "App" >
                <NavBar
                    view = { this.state.view }
                    clickHandler = { (mode) => this.switchViewHandler(mode) }
                />
                <div className = "appTitle">
                    Schedules
                </div>
                <ScheduleForm
                    ip = { this.state.ip }
                    token = { this.state.token }
                    lights = { this.state.light }
                    groups = { this.state.group }
                    schedule = { edit ? this.state.schedule[parseInt(this.state.editingSchedule)] : null }
                    RGBToXy = { (c) => this.RGBToXy(c) }
                    xyToRGB = { (xy, bri) => this.xyToRGB(xy, bri) }
                    parseTimeInfo = { (string) => this.parseTimeInfo(string) }
                    edit = { edit }
                    editKey = { this.state.editingSchedule }
                    finish = { () => this.goToNormal() }
                    onClickBack = { () => this.goToNormal() }
                />
            </div>
        );
    }

    createLightSetupView() {
        window.scrollTo(0, 0);
        this.selectLightHandler(true, this.state.editingLight);
        return(
            <div className= "App" >
                <NavBar
                    view = { this.state.view }
                    clickHandler = { (mode) => this.switchViewHandler(mode) }
                />
                <div className = "appTitle">
                    Lights
                </div>
                <LightForm
                    editName = { this.state.light[parseInt(this.state.editingLight)].name }
                    onClickSubmit = { (event) =>  this.updateLightName(event) }
                    onClickBack = { () => this.goToNormal() }
                />
            </div>
        )
    }

    createTokenSetupView() {

        let tf = <TokenForm
                    ip = { this.state.ip }
                    setToken = { (t, isNew) => this.setToken(t, isNew) }
                    createNewToken = { () => this.createNewToken() }
                />
        let tn  = <TokenNote
                    proceedHandler = { () => this.disableNote() }
                    token = { this.state.token }
                />
        return(
            <div className="App">
                <div className="appTitle">
                    API Token Setup
                </div>
                { this.state.showNote ? tn : tf }
            </div>
        );
    }

    render() {
        if (!this.state.ip) {
            return (this.createConfigureIPView());
        } else if (!this.state.token || this.state.showNote) {
            return (this.createTokenSetupView());
        } else if (this.state.view === "creatingGroup") {
            return (this.createGroupSetupView(false));
        } else if (this.state.view === "editingGroup") {
            return (this.createGroupSetupView(true));
        } else if (this.state.view === "editingLight") {
            return (this.createLightSetupView());
        } else if (this.state.view === "creatingSchedule") {
            return (this.createScheduleSetupView(false));
        } else if (this.state.view === "editingSchedule") {
            return (this.createScheduleSetupView(true));
        } else if (this.state.view === "lights") {
            return (this.createLightView());
        } else if (this.state.view === "groups") {
            return (this.createGroupView());
        } else if (this.state.view === "schedules") {
            return (this.createScheduleView());
        } else if (this.state.view === "reset") {
            return (this.createResetView());
        }
    }
}

export default App;