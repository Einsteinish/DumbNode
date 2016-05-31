import React from 'react';
import tr from 'i18next';
import Debug from 'debug';

let debug = new Debug("components:alert");

Alert.propTypes = {
  title: React.PropTypes.string,
  name: React.PropTypes.string,
  message: React.PropTypes.string,
  code: React.PropTypes.string
};

export default function Alert({title, name, message, code}){
    debug('name: ', name)
    return (
        <div className="alert alert-danger text-center animate bounceIn" role="alert">
            {title && (
                <h3>{title}</h3>
            )}
            {name && (
                <div>{tr.t('An error occured')}
                    <div>{name}</div>
                </div>
            )}
            {message && (
                <div>{message}</div>
            )}
            {code && (
                <div>
                    <div>{tr.t('Status Code')}</div>
                    <div>{code}</div>
                </div>
            )}
        </div>
    )
}
