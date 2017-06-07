openfin-react-widgets
---------------------
Use this if you want to create child windows out of a single React component and not have to worry about all the plumbing.
Features:

* Widget React component can trigger events to be consumed (and isolated to) the creator of the Widget
* Widget creator (parent Window) can set props on the Widget
* virtually no setup code as long as you follow a couple guidelines

## Installation
```bash
npm i --save openfin-react-widgets
```

Create a module that contains all of your widgets associated with a unique key
```javascript
export default {
  foo: MyFooWidget,
  bar: MyBarWidget
}
```

Add this bit of code to your app entry point (you should be using Webpack by now...)
```javascript
import { initWidgetHandler } from 'openfin-react-widgets';
import myWidgets from './widgets'; // your widgets module from above

// most of this is boilerplate code required by openfin
document.addEventListener('DOMContentLoaded', function() {
  try {
    fin.desktop.main(function() {
      const root = document.getElementById('root'); // or whatever your root DOM element is for React mounting
      initWidgetHandler(widgets, () => {
        // whatever app init logic you would normally have without a widget handler
        ReactDOM.render(<App />, root);
      }, root);
    });
  } catch (e) {
    // no fin... standard browser
  }
});
```

## Opening a Widget
```javascript
import { showWidget } from 'openfin-react-widgets';
...
showWidget({
  type: 'foo', // must match a key in our widgets definitions module
  options: {
    // whatever fin Window options you want - http://cdn.openfin.co/jsdocs/beta/fin.desktop.Window.html#~options
  },
  props: {
    // any initial props that you would like passed to your widget
    message: 'hello'
  },
  events: {
    // you always have the `close` event available
    close: () => { alert('the widget was closed'); },
    // any custom events you want your Widget to be able to trigger
    onSomeButtonClick: ({ message }) => { alert('the message is ' + message); }
  }
})
.then((handle) => {
  // see Widget Handle Properties
})
```

## Widget Handle Properties
* ***close***: function to execute when Widget Window should be closed
* ***window***: the fin Window instance containing the Widget (do not use this `close` function)
* ***setProps***: call this any time to set new props on your Widget

## Widget React Component
```javascript
// `trigger` was provided automatically and `message` was provided by Widget creator
export default MyFooWidget ({ trigger, message }) {
  return (
    <div>
      the message is {message}.
      <br/>
      click <button type="button" onClick={() => trigger('onSomeButtonClick', { message: 'world' })}>this button</button>
    </div>
  );
}
```