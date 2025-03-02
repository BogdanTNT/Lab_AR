declare module "react-plotly.js" {
    import { Component } from "react";
    import { Layout, Data, Config } from "plotly.js";
  
    interface PlotParams {
      data: Data[];
      layout?: Partial<Layout>;
      config?: Partial<Config>;
      style?: React.CSSProperties;
    }
  
    export default class Plot extends Component<PlotParams> {}
  }
  