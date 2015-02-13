'use strict';

var React = require('react');

module.exports = React.createClass({
    render: function () {
        var data = this.props.data;
        return <div>{data.fullName}</div>;
    }
});
