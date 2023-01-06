import React, { useEffect, useRef, useState } from 'react';
import { DxButton, LoadingPlaceholder } from 'genesys-react-components';

import GenesysCloudAPI from '../../helpers/GenesysCloudAPI';
import OrgChart from './OrgChart';

import './OrgChartApp.scss';

interface IProps {
	region: string;
}

export default function OrgChartApp(props: IProps) {
	const [region, setRegion] = useState<string>(props.region);
	const [isAuthorized, setIsAuthorized] = useState<boolean>();
	const api = useRef<GenesysCloudAPI>(new GenesysCloudAPI(region));

	// On region changed (state)
	useEffect(() => {
		// Instantiate a new API instance for the region
		api.current = new GenesysCloudAPI(region);

		// Check authorization
		if (api.current.accessToken) {
			// An auth token exists, so let's check to see if it's valid
			setIsAuthorized(undefined);
			(async () => setIsAuthorized(await api.current.IsAuthorized()))();
		} else {
			// Don't have an access token, so skip the check
			setIsAuthorized(false);
		}
	}, [region]);

	// On region changed (props)
	useEffect(() => {
		// Update state if new prop is different
		if (region !== props.region) {
			setRegion(props.region);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [props.region]);

	return (
		<div className="org-chart-app">
			{isAuthorized === undefined && <LoadingPlaceholder text="Checking authorization..." />}
			{isAuthorized === false && (
				<div>
					<DxButton onClick={() => api.current.InitiateAuthFlow()}>Authorize with Genesys Cloud ({region})</DxButton>
				</div>
			)}
			{isAuthorized && (
				<div className="content">
					<OrgChart api={api.current} />
				</div>
			)}
		</div>
	);
}
