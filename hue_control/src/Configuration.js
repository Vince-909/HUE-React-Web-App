import React from "react";

class ConfigurationForm extends React.Component {

    constructor(props) {
        super(props);
        this.state = { locked: false, name: "", outcome: "", error: false, success: false, thinking: false };
    }

    validateForm() {
        return (this.state.locked || this.state.name === "") ? false : true;
    }

    updateNameState(event) {
        var name = event.target.value;
        let newState = { ...this.state, name };
        this.setState(newState);
    }

    clearOutcome() {
        let newState = { ...this.state, outcome: "", error: false, success: false, locked: false };
        this.setState(newState);
        
    }

    async submitIP(event) {
        event.preventDefault();
        this.clearOutcome();
        console.log(this.state.error)
        let ip = event.target.ip.value;
        let newState = { ...this.state, locked: !this.state.locked, thinking: true, error: false };
        this.setState( newState );
        let result = await this.props.submitHandler(ip);
        if (result === "error") {
            newState = { ...this.state, outcome: "No bridge found at the provided IP", error: true, success: false, thinking: false };
            this.setState( newState );
            setTimeout(() => {
                this.clearOutcome();
            }, 2000);
        } else {
            newState = { ...this.state, outcome: "Bridge located!", success: true, error: false, thinking: false };
            this.setState( newState );
            setTimeout(() => {
                this.clearOutcome();
                this.props.setBridgeIP(ip);
            }, 2000);
        }
    }

    render() {
        let loadingIcon = <img src = "loading.gif" width = "48" height = "48" />
        return (
            <div className="configWrapper">
                <div className="configContainer">
                    <form onSubmit = { (event) => { this.submitIP(event) } } >
                        Bridge IP: { " " }
                        <input
                            type = "text"
                            name = "ip"
                            onChange = { (ch) => this.updateNameState(ch) }
                        />
                        <div className="errorWrapper">
                            { this.state.error == true ? this.state.outcome : null }
                            { this.state.thinking == true ? loadingIcon : null }
                        </div>
                        <div className="successWrapper">
                            { this.state.success == false ? null : this.state.outcome }
                        </div>
                        <br></br>
                        <div>
                        <input
                            type = "submit"
                            name = "sub"
                            className = "roundedButton"
                            disabled = { !this.validateForm() }
                            value = "Submit"
                        />
                        </div>
                    </form>
                </div>
            </div>
        );
    }
}


class TokenForm extends React.Component {

    constructor(props) {
        super(props);
        this.state = { locked: false, token: "", submitError: "", createError: "", success: false, error: false };
    }

    clearError() {
        let newState = { ...this.state, submitError: "", createError: "", error: false, success: false, locked: false };
        this.setState(newState);
    }

    validateForm() {
        return (this.state.locked || this.state.token === "") ? false : true;
    }

    updateTokenState(event) {
        var token = event.target.value;
        let newState = { ...this.state, token };
        this.setState(newState);
    }

    async submitHandler(event) {
        event.preventDefault();
        let token = event.target.token.value;
        let newState = { locked: !this.state.locked };
        this.setState( newState );
        let result = await (this.tryToken(token));
        if (result.startsWith("error")) {
            newState = { ...this.state, submitError: result, error: true };
            this.setState(newState);
            setTimeout(() => 
                this.clearError()
            , 2000);
        } else {
            newState = { ...this.state, success: true, submitError: "token accepted", error: false };
            this.setState( newState )
            setTimeout(() => {
                this.props.setToken(token, false);
            }, 2000);
        }
    }

    async tryToken(token) {
        var result;
        try {
            result = await fetch("http://" + this.props.ip + "/api/" + token, { method: "GET" });
        } catch(error) {
            result = "error";
        }
        if (result !== "error") {
            result = (await result.json())[0];
            let fail = false;
            let desc = "";
            for (let keys in result) {
                if (keys === "error") {
                    fail = true;
                    desc = result[keys].description;
                } else if (keys === "success") {
                    desc = result[keys].username;
                }
            }
            if (!fail) {
                return token;
            } else {
                return ("error: " + desc);
            }
        }
        if (result === "error") {
            return "error: Something went wrong"
        }
    }

    async onClickCreateHandler() {
        let res = await this.props.createNewToken()
        if (res.startsWith("error")) {
            let newState = { ...this.state, createError: res, locked:true, error: true }
            this.setState(newState)
            setTimeout(() => 
                this.clearError()
            , 2000);
        } else {
            this.props.setToken(res, true)
        }
    }

    render() {
        return (
            <div className="configWrapper">
                <div className="configContainer">
                    <form
                        onSubmit = { (event) => { this.submitHandler(event) } }
                    >
                        Provide an existing API token:
                        <p></p>
                        <input
                            type="text"
                            onChange = { (ch) => this.updateTokenState(ch) }
                            name="token"
                        />
                        <br></br>
                        <div className="errorWrapperToken" >
                            { this.state.error == true && this.state.submitError === "error: unauthorized user" ? "unknown token" : "" }
                        </div>
                        <div className="successWrapper" >
                            { this.state.success == false ? null : this.state.submitError }
                        </div>
                        <p></p>
                        <input
                            type = "submit"
                            name = "sub"
                            className = "roundedButton"
                            disabled = { !this.validateForm() }
                            value = "Submit"
                        />
                        <p></p>
                        or create a new one
                        <br></br>
                        (bridge link button must be pressed):
                        <br></br>
                        <div className = "errorWrapperToken" >
                            { this.state.error ? this.state.createError : null }
                        </div>
                        <p></p>
                        <input
                            type = "button"
                            className = "roundedButton"
                            disabled = { this.state.locked }
                            value = "Create"
                            onClick = { () => this.onClickCreateHandler() }
                        />
                    </form>
                </div>
            </div>
        )
    }
}

class TokenNote extends React.Component {

    render() {
        return(
            <div className="configWrapper">
                <div className="configContainer">
                    <form>
                        A new API token was created,<br></br>
                        please write it down for future use:<br></br>
                        <b>{ this.props.token }</b>
                        <br></br>
                        <input
                            type = "button"
                            className = "roundedButton"
                            value = "Proceed"
                            onClick = { () => this.props.proceedHandler() }
                        />
                    </form>
                </div>
            </div>         
        )
    }
}

class ResetConfigForm extends React.Component {

    render() {
        return(
            <div className="groupWrapper">
                <div className="createGroupContainer">
                    <div className="backContainer">
                        <input
                            type = "button"
                            className = "backIcon"
                            onClick = { () => this.props.onClickBack() }
                        />
                    </div>
                    <table className = "resetTable">
                        <tbody>
                            <tr>
                                <td className = "leftc">
                                    <b>Bridge IP:</b>
                                </td>
                                <td className = "rightc">
                                    { this.props.ip }
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <b>Access Token:</b>
                                </td>
                                <td>
                                    { this.props.token }
                                </td>
                            </tr>
                            <tr>
                                <td colSpan = "2">
                                    <input
                                        type = "button"
                                        className = "roundedButton"
                                        value = "Reset"
                                        onClick = { () => this.props.reset() }
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

export {
    ConfigurationForm,
    TokenForm,
    TokenNote,
    ResetConfigForm
}