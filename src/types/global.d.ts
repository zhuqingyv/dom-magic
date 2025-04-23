declare global {
  interface HTMLElement {
    [key: symbol]: {
      tagName: string;
      props: object;
      events: {
        [key: string]: (event: Event) => void;
      },
      update: any;
    }
  }
}

export { }; 