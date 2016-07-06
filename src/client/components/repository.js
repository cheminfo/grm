'use strict';

import React from 'react';
import agent from 'superagent';

export default React.createClass({
    getInitialState() {
        return {
            loading: true
        };
    },
    componentDidMount() {
        agent
            .get(`repo/${this.props.repo.owner}/${this.props.repo.name}?action=status`)
            .end((err, res) => {
                var body = res.body;
                body.loading = false;
                if (this.isMounted()) {
                    this.setState(body);
                }
            });
    },
    getDetails() {
        agent
            .get(`repo/${this.props.repo.owner}/${this.props.repo.name}?action=status&details=true`)
            .end((err, res) => {
                var body = res.body;
                body.loading = false;
                this.setState(body);
            });
    },
    switchEnable() {
        this.lock();
        agent
            .get(`repo/${this.state.owner}/${this.state.name}?action=enable`)
            .end((err, res) => {
                var result;
                if (res.status === 200) {
                    result = res.body;
                } else {
                    result = {
                        error: 'Enable failed'
                    };
                }
                result.locked = false;
                this.setState(result);
            });
    },
    release(inc) {
        var confirm = window.confirm(`Bump ${this.props.repo.name} to the next ${inc}?`);
        if (confirm) {
            this.lock();
            agent
                .get(`repo/${this.state.owner}/${this.state.name}?action=publish&bump=${inc}`)
                .end((err, res) => {
                    var result;
                    if (res.status === 200) {
                        result = res.body;
                    } else {
                        result = {
                            error:`Error during release process: ${res.text}`
                        };
                    }
                    result.locked = false;
                    this.setState(result);
                });
        }
    },
    buildHead() {
        this.lock();
        agent
            .get(`repo/${this.state.owner}/${this.state.name}?action=head`)
            .end((err, res) => {
                var result = {
                    locked: false
                };
                if (res.status !== 200) {
                    result.error = `Error during HEAD build: ${res.text}`;
                }
                this.setState(result);
            });
    },
    npmPublish() {
        this.lock();
        agent
            .get(`repo/${this.state.owner}/${this.state.name}?action=npm`)
            .end((err, res) => {
                var result = {
                    locked: false
                };
                if (res.status !== 200) {
                    result.error = `Error during NPM publish: ${res.text}`;
                }
                this.setState(result);
            });
    },
    lock() {
        this.setState({
            locked: true,
            error: false
        });
    },
    render() {
        var active = this.state.active;
        if (!this.props.visible && !active) {
            return (<tr ></tr>);
        }
        if (this.state.loading) {
            return (
                <tr>
                    <td></td>
                    <td>
                        {this.props.repo.name}
                    </td>
                    <td>
                        loading...
                    </td>
                </tr>
            );
        } else {
            var checked = active ? 'checked' : null;
            var locked = this.state.locked;
            if (active) {
                var version = this.state.version;
                var name = this.props.repo.name;
                var owner = this.props.repo.owner;
                return (
                    <tr>
                        <td>
                            <input type="checkbox" checked={checked} disabled={locked}
                                   onChange={this.switchEnable}/>
                        </td>
                        <td>
                            {name}
                        </td>
                        <td>
                            <strong>v{version}</strong>
                        </td>
                        <td>
                            <input type="button" value="patch"
                                   onClick={() => this.release('patch')} disabled={locked} />
                            <input type="button" value="minor"
                                   onClick={() => this.release('minor')} disabled={locked} />
                            <input type="button" value="major"
                                   onClick={() => this.release('major')} disabled={locked} />
                            &nbsp;<input type="button" value="HEAD"
                                         onClick={this.buildHead} disabled={locked} />
                            &nbsp;<input type="button" value="NPM"
                                   onClick={this.npmPublish} disabled={locked} />
                        </td>
                        <td>
                            <a href={`https://www.npmjs.com/package/${this.state.npm || ''}`}>
                                <img src={`https://img.shields.io/npm/v/${this.state.npm || ''}.svg?style=flat-square`} alt="npm package status" />
                            </a>
                        </td>
                        <td>
                            <a href={`https://travis-ci.org/${owner}/${name}`}>
                                <img src={`https://img.shields.io/travis/${owner}/${name}/master.svg?style=flat-square`} alt="build status" />
                            </a>
                        </td>
                        <td>
                            <input type="button" value="details"
                                   onClick={this.getDetails} disabled={locked} />
                        </td>
                        <td>
                            {this.state.error ? this.state.error : ''}
                        </td>
                    </tr>
                );
            } else {
                return (
                    <tr>
                        <td>
                            <input type="checkbox" checked={checked} disabled={locked}
                                   onChange={this.switchEnable}/>
                        </td>
                        <td>
                            {this.props.repo.name}
                        </td>
                    </tr>
                );
            }
        }
    }
});
