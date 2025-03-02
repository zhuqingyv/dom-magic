type EventName = keyof HTMLElementEventMap;

export const eventSetter = function (this: HTMLElement, eventName: string) {
  const element = this;
  const actualEventName = eventName.toLowerCase().slice(2) as EventName; // Remove 'on' prefix

  return function(this: any, callback: (event: Event) => void) {
    element.addEventListener(actualEventName, callback);
    return this;
  };
};