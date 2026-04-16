interface Props {
  widgetKey: string;
}

/**
 * Renders the global API-Sports config widget once for the entire app.
 * This mirrors the documented setup: one config tag plus any number of widgets.
 */
export function WidgetConfig({ widgetKey }: Props) {
  if (!widgetKey.trim()) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', pointerEvents: 'none' }}
    >
      <api-sports-widget
        data-type="config"
        data-key={widgetKey}
        data-sport="football"
        data-lang="en"
        data-theme="OddsDetector"
        data-show-errors="true"
        data-team-squad="true"
        data-team-statistics="true"
        data-player-statistics="true"
        data-player-trophies="true"
        data-player-injuries="true"
      />
    </div>
  );
}
