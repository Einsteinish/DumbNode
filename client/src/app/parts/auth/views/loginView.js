import React from 'react';
import { Link } from 'react-router';
import tr from 'i18next';
import Paper from 'material-ui/Paper';
import FlatButton from 'material-ui/FlatButton';

import MediaSigninButtons from '../components/mediaSigninButtons';
import LocalLoginForm from '../components/localLoginForm';
import DocTitle from 'components/docTitle';

import Debug from 'debug';
let debug = new Debug("views:login");

export default React.createClass( {
    contextTypes: {
        router: React.PropTypes.object.isRequired
    },
    propTypes:{
    },

    componentWillReceiveProps(nextProps){
        debug("componentWillReceiveProps", nextProps);
        let path = nextProps.location.query.nextPath || '/app';
        debug("componentWillReceiveProps next path: ", path);
        if (nextProps.authenticated) {
            this.context.router.push(path);
        }
    },
    render() {
        return (
            <div id='login'>
                <DocTitle
                    title="Login"
                />
                <Paper className="text-center view">
                    <h2 >{tr.t('login')}</h2>

                        <div>
                            <LocalLoginForm {...this.props}/>

                            <div className="strike"><span className="or"></span></div>
                            <div>
                                <MediaSigninButtons />
                            </div>
                            <div className="strike"><span className="or"></span></div>
                            <FlatButton
                                      label={tr.t('forgotPassword')}
                                      containerElement={<Link to="/forgot" />}
                                      linkButton={true}
                                    />
                        </div>
                </Paper>
            </div>
        );
    }
} );
