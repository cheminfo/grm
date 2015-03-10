'use strict';

import React from 'react';
import agent from 'superagent';
import semver from 'semver';

export default React.createClass({
    getInitialState() {
        return {
            loading: true
        };
    },
    componentDidMount() {
        agent
            .get(`repo/${this.props.repo.owner}/${this.props.repo.name}?action=status`)
            .end(res => {
                var body = res.body;
                body.loading = false;
                if (this.isMounted()) {
                    this.setState(body);
                }
            });
    },
    switchEnable() {
        this.setState({
            locked: true
        });
        agent
            .get(`repo/${this.state.owner}/${this.state.name}?action=enable`)
            .end(res => {
                res.body.locked = false;
                this.setState(res.body);
            });
    },
    release(inc) {
        var v = semver(this.state.version);
        v.inc(inc);
        var confirm = window.confirm(`Bump ${this.props.repo.name} to v${v.version}?`);
        if (confirm) {
            this.setState({
                locked: true
            });
            agent
                .get(`repo/${this.state.owner}/${this.state.name}?action=publish&bump=${inc}`)
                .end(res => {
                    res.body.locked = false;
                    this.setState(res.body);
                });
        }
    },
    npmPublish() {
        this.setState({
            locked: true
        });
        agent
            .get(`repo/${this.state.owner}/${this.state.name}?action=npm`)
            .end(() => {
                this.setState({locked: false});
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
                var sversion = semver(version);
                sversion.inc('patch');
                var patch = sversion.version;
                sversion.inc('minor');
                var minor = sversion.version;
                sversion.inc('major');
                var major = sversion.version;
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
                            <input type="button" value={patch}
                                   onClick={this.release.bind(this, 'patch')} disabled={locked} />
                            <input type="button" value={minor}
                                   onClick={this.release.bind(this, 'minor')} disabled={locked} />
                            <input type="button" value={major}
                                   onClick={this.release.bind(this, 'major')} disabled={locked} />
                            &nbsp;<input type="button" value="NPM"
                                   onClick={this.npmPublish} disabled={locked} />
                        </td>
                        <td>
                            <a href={`https://travis-ci.org/${owner}/${name}`}>
                                <img src={`https://img.shields.io/travis/${owner}/${name}/master.svg?style=flat-square`} alt="build status" />
                            </a>
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
