/* global io, $ */
/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license GPL-3.0
 */

import React from 'react';
import Promise from 'bluebird';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import {EventEmitter2} from 'eventemitter2';
import {configureStore} from 'redux-starter-kit';
import 'react-notifications/lib/notifications.css';
import 'bulma-extensions/dist/css/bulma-extensions.min.css';
import {NotificationContainer, NotificationManager} from 'react-notifications';

import './scss/index.scss';
import App from './react/App';
import Util from './util/Util';
import baseConfig from '../../base-config';
import DataManager from './util/DataManager';
import IpcModule from '../../shared/IpcModule';
import * as serviceWorker from './util/serviceWorker';
import ogmaAppReducer from './redux/OgmaAppReducer';
import ErrorHandler, {UserFriendlyError} from './util/ErrorHandler';

Promise.config({
    cancellation: true,
    warnings: {
        wForgottenReturn: false,
    },
});

// Init basic window params
window.isDevelopment = process.env.NODE_ENV !== 'production';

window.handleError = ErrorHandler.handleMiscError;
window.handleErrorQuiet = ErrorHandler.handleMiscErrorQuiet;

if (window.isDevelopment) {
    console.log('Ogma app running in development mode.');
    window.serverHost = `http://${baseConfig.ogmaHost}:${baseConfig.ogmaPort}`;
} else {
    window.serverHost = '';
}

// Initialize notification component (only need to do this once)
ReactDOM.render(<NotificationContainer/>, document.getElementById('notif'));

// Load Socket.IO scripts from the server
const socketIoLoadPromise = Promise.resolve()
    .then(() => {
        const localUrl = `/socket.io/socket.io.js`;
        const fullUrl = `${window.serverHost}${localUrl}`;
        const errorString = 'Could not download the Socket.io script from the server.';
        if (window.isDevelopment) {
            return Util.loadScript(fullUrl)
                .catch(() => {
                    throw new Error(errorString);
                });
        } else {
            return Util.loadScript(localUrl)
                .catch(() => {
                    throw new Error(errorString);
                });
        }
    });

// Socket.IO connection logic
const socketInitPromise = socketIoLoadPromise.then(() => new Promise(resolve => {
    const socket = io.connect(window.serverHost);

    let firstConnection = true;
    socket.on('connect', () => {
        NotificationManager.success('Successfully connected to Ogma server.');

        if (firstConnection) {
            firstConnection = false;
            resolve(socket);
        }
    });
    socket.on('disconnect', () => {
        NotificationManager.warning('Lost connection to server!');
    });
    socket.on('connect_error', error => {
        NotificationManager.error('Error occurred when connecting to server.');
        console.error(error);
    });
}));

// Prepare loader reference
const appLoaderDiv = $('#app-loader');

// Initialize the rest of the app if socket connection succeeded
socketInitPromise
    .then(socket => {
        // Setup the event emitter
        window.proxyEmitter = new EventEmitter2({wildcard: true, newListener: false, maxListeners: 20});

        // Setup logic for forwarded event
        const eventHandler = eventData => window.proxyEmitter.emit(eventData.name, ...eventData.args);
        const errorHandler = errorMessage => new UserFriendlyError({
            title: 'Server-side error',
            message: `Server has encountered an error: "${errorMessage}"`,
        });
        window.ipcModule = new IpcModule({socket, eventHandler, errorHandler});
        return socket;
    })
    .then(socket => {
        const store = configureStore({reducer: ogmaAppReducer});
        window.dataManager = new DataManager({socket, store});
        return window.dataManager.init()
            .then(() => store);
    })
    .then(store => {
        appLoaderDiv.hide();
        ReactDOM.render(<Provider store={store}><App/></Provider>, document.getElementById('root'));
    })
    .catch(error => {
        console.error(error);
        const errorDiv = $('#app-loader-message');
        errorDiv.addClass('error');
        errorDiv.html(`Startup error: &nbsp;<strong>${error.message}</strong>`);
    });

// Do nothing with server workers since we don't support them yet
serviceWorker.unregister();
