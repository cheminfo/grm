'use strict';

import React from 'react';

export default React.createClass({
    render() {
        var data = this.props.data;
        return <div>{data.fullName}</div>;
    }
});
