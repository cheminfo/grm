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
            .get(`/repo/${this.props.repo.owner}/${this.props.repo.name}?action=status`)
            .end(res => {
                var body = res.body;
                body.loading = false;
                if (this.isMounted()) {
                    this.setState(body);
                }
            });
    },
    switchEnable() {
        console.log('TODO switchenable');
        /*agent
            .get(`/repo/${data.owner}/${data.name}?action=enable`)
            .end(function (res) {

            });*/
    },
    releasePatch() {
        this.release('patch');
    },
    releaseMinor() {
        this.release('minor');
    },
    releaseMajor() {
        this.release('major');
    },
    release(inc) {
        console.log('TODO release ' + inc);
    },
    render() {
        var active = this.state.active;
        if (!this.props.visible && !active) {
            return (<tr></tr>);
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

            if (active) {
                var version = this.state.version;
                var sversion = semver(version);
                sversion.inc('patch');
                var patch = sversion.version;
                sversion.inc('minor');
                var minor = sversion.version;
                sversion.inc('major');
                var major = sversion.version;
                return (
                    <tr>
                        <td>
                            <input type="checkbox" checked={checked}
                                   onChange={this.switchEnable}/>
                        </td>
                        <td>
                            {this.props.repo.name}
                        </td>
                        <td>
                            v{version}
                        </td>
                        <td>
                            <input type="button" value={patch}
                                   onClick={this.releasePatch}/>
                            <input type="button" value={minor}
                                   onClick={this.releaseMinor}/>
                            <input type="button" value={major}
                                   onClick={this.releaseMajor}/>
                        </td>
                    </tr>
                );
            } else {
                return (
                    <tr>
                        <td>
                            <input type="checkbox" checked={checked}
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
