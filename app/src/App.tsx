import React, { useEffect, useState } from 'react';
import { DxItemGroup, DxItemGroupItem, DxToggle } from 'genesys-react-components';
import { GenesysDevIcons } from 'genesys-dev-icons';

import { default as regionItems } from './regions.json';

import './App.scss';
import OrgChartApp from './components/orgchartapp/OrgChartApp';

const DARK_THEME_ENABLED_KEY = 'dark-theme';
const REGION_KEY = 'region';

function App() {
  // Load theme choice from local storage
	const [darkThemeEnabled, setDarkThemeEnabled] = useState<boolean>(localStorage.getItem(DARK_THEME_ENABLED_KEY) === 'true');
  // Load region from local storage
	const [region, setRegion] = useState<string>(localStorage.getItem(REGION_KEY) || 'mypurecloud.com');
  // Populate region dropdown items
	const [regions, setRegions] = useState<DxItemGroupItem[]>(regionItems);

  // On theme changed
	useEffect(() => {
		// Save theme setting
		localStorage.setItem(DARK_THEME_ENABLED_KEY, darkThemeEnabled ? 'true' : '');
	}, [darkThemeEnabled]);

  // On region changed
	useEffect(() => {
		// Save theme setting
		localStorage.setItem(REGION_KEY, region || 'mypurecloud.com');

    // Update region list to synchronize data items
		const updatedRegions = [...regions];
		updatedRegions.forEach((r) => (r.isSelected = r.value === region));
		setRegions(updatedRegions);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [region]);

	return (
		<div className={`org-chart-explorer theme-${darkThemeEnabled ? 'dark' : 'light'}`}>
			<div className="header">
				<h1>Org Chart Explorer</h1>
				<DxToggle
					className="theme-toggle"
					value={darkThemeEnabled}
					falseIcon={GenesysDevIcons.AppSun}
					trueIcon={GenesysDevIcons.AppMoon}
					onChange={(value) => setDarkThemeEnabled(value === true)}
				/>
				<DxItemGroup
					format="dropdown"
					items={regions as DxItemGroupItem[]}
					onItemChanged={(item: DxItemGroupItem) => setRegion(item.value)}
				/>
			</div>
			<div className="app">
				<OrgChartApp region={region} />
			</div>
		</div>
	);
}

export default App;
