export type ToolConfigProps<TConfig> = {
  config: TConfig;
  onChange: <K extends keyof TConfig & string>(key: K, value: TConfig[K]) => void;
};
