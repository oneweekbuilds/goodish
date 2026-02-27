// Web polyfill: Prevent CSSStyleDeclaration indexed property crash
// react-native-web occasionally passes style arrays to React DOM without flattening,
// causing "Failed to set an indexed property [0] on 'CSSStyleDeclaration'" errors.
//
// Fix: Patch React.createElement on web to auto-flatten style arrays before they
// reach React DOM. This catches all style arrays regardless of which component they're on.
//
// IMPORTANT: We use require() below (not import) so the polyfill runs BEFORE expo-router loads.

const isWeb = typeof document !== 'undefined';

if (isWeb) {
  // Import React and StyleSheet synchronously via require so we can patch before app loads
  const React = require('react');
  const { StyleSheet } = require('react-native');

  const origCreateElement = React.createElement;

  React.createElement = function patchedCreateElement(type: any, props: any, ...children: any[]) {
    if (props && props.style != null && Array.isArray(props.style)) {
      props = { ...props, style: StyleSheet.flatten(props.style) };
    }
    return origCreateElement.call(React, type, props, ...children);
  };

  // Copy over static properties (like React.createElement.name, etc.)
  try {
    Object.keys(origCreateElement).forEach((key) => {
      (React.createElement as any)[key] = (origCreateElement as any)[key];
    });
  } catch (e) {
    // Ignore if copying fails
  }

  // Also add a global error handler as safety net for any remaining style issues
  window.addEventListener('error', function(event: ErrorEvent) {
    if (event.message && event.message.includes('indexed property') && event.message.includes('CSSStyleDeclaration')) {
      event.preventDefault();
      event.stopPropagation();
      console.warn('[WebPolyfill] Suppressed CSSStyleDeclaration indexed property error');
      return true;
    }
  }, true);
}

// Now load the app
require('expo-router/entry');
