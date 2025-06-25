
const loaderEvents = new EventTarget();

export const startLoader = () => {
  loaderEvents.dispatchEvent(new Event('start'));
};

export const loaderEventTarget = loaderEvents;
