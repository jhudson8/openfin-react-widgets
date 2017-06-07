import React from 'react';
import ReactDOM from 'react-dom';

// every new widget invocation gets a new unique name
let uid = 0;

/**
 * Show a widget
 * - type: must match a key in the `widgets` init param
 * - options: fin window options
 * - props: React Component (Widget) props (`trigger` will be included as an additional prop)
 * - events: object (key is event key, value is callback function) to be executed when widget calls `trigger` prop
 */
export function showWidget ({ type, options, props, events }) {
  const uuid = ('widget' + uid++);
  const parent = fin.desktop.Window.getCurrent();
  const location = window.location;

  return new Promise((resolve, reject) => {
    // create our fin window options
    options = Object.assign({
      name: uuid,
      customData: {
        uuid: uuid,
        __widget: type,
        parent: {
          name: parent.name,
          uuid: parent.uuid
        },
        props: props
      },
      url: location.origin + location.pathname
    }, options);

    const window = new fin.desktop.Window(options, () => {
      // listen for `trigger` events
      function eventListener ({ event, to, from, payload }) {
        // make sure they apply only to the initiator of this Widget
        if (event === 'trigger' && to === parent.name && from === uuid) {
          const handler = events && events[payload.type];
          if (handler) {
            // if the event handler exists... call it
            handler(payload.payload);
          }
        }
      }
      fin.desktop.InterApplicationBus.subscribe('*', '__widget', eventListener);

      // trigger the `close` event when the window is closed
      function closeListener () {
        const handler = events && events.closed;
        if (handler) {
          handler();
        }
      }
      window.addEventListener('closed', closeListener);

      // our promise response payload
      const rtn = {
        // the fin Window
        window: window,
        // close function to be used instead of window.close (to clean up Widget event listeners)
        close: function () {
          fin.desktop.InterApplicationBus.unsubscribe('*', '__widget', eventListener);
          window.removeEventListener('closed', closeListener);
          window.close();
        },
        // function to set props on the Widget
        setProps: function (props) {
          fin.desktop.InterApplicationBus.publish('__widget', {
            event: 'setProps',
            to: uuid,
            from: parent.uuid,
            payload: props
          });
        }
      };

      window.show();
      resolve(rtn);
    }, (e) => {
      reject(e);
    });
  });
}

/**
 * Initializer for the widget handler, it will override your application init if a Window which
 * should display a Widget is present
 * Usage
 *   import { initWidgetHandler } from 'openfin-react-widgets';
 *   import widgets from './path/to/widgets' - { _widget_key_: WidgetReactComponent, ... }
 *   ...
 *   const root = document.getElementById('root'); - or whatever your root React mounting DOM element is
 *   initWidgetHandler({
 *     widgets: widgets,
 *     appInit: () => {
 *       // initialize your app normally... set up routing and stuff
 *       ReactDOM.render(<App />, root);
 *     },
 *     rootElement: root
 *  });
 */
export function initWidgetHandler (options) {
  const {
    widgets,
    appInit,
    widgetInit = () => {},
    widgetWrapper = (widget) => widget,
    rootElement
  } = options;
  if (!widgets) {
    throw new Error('undefined widgets');
  }

  // since rootElement may not be the body element and we want our widget to take up the whole viewport...
  Object.assign(rootElement.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    zIndex: '999'
  });

  const _window = fin.desktop.Window.getCurrent();
  _window.getOptions((options) => {
    // see if this window represents a Widget
    const customData = options.customData;
    if (customData) {
      const type = customData.__widget;
      if (type) {
        // make sure we have a matching Widget in our widgets index
        const Widget = widgets[type];
        if (Widget) {
          const initValue = widgetInit(customData, Widget);
          // we've got a widget to render
          const parentUUID = customData.parent.uuid;

          // allow the Widget to trigger events to the parent (a `trigger` prop (type, payload) will be set in Widget props)
          const trigger = function (type, payload) {
            fin.desktop.InterApplicationBus.publish('__widget', {
              event: 'trigger',
              to: parentUUID,
              from: customData.uuid,
              payload: {
                type: type,
                payload: payload
              }
            });
          };

          // allow for the parent Window to set new properties on the Widget
          const setProps = function ({ event, to, from, payload }) {
            if (event === 'setProps' && to === customData.uuid && from === parentUUID) {
              ReactDOM.render(widgetWrapper(<Widget {...payload} trigger={trigger}/>, initValue), rootElement);
            }
          };

          const closeListener = function () {
            fin.desktop.InterApplicationBus.unsubscribe('*', '__widget', setProps);
          };

          _window.addEventListener('closed', closeListener);
          fin.desktop.InterApplicationBus.subscribe('*', '__widget', setProps);
          ReactDOM.render(widgetWrapper(<Widget {...customData.props} trigger={trigger}/>, initValue), rootElement);
          return;
        } else {
          throw new Error('unregistered widget type: ' + type);
        }
      }
    }
    appInit();
  }, appInit);
}
