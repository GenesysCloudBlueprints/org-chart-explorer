// API schemas sourced from the Platform Client SDK
// https://github.com/MyPureCloud/platform-client-sdk-javascript/blob/master/build/index.d.ts

export interface User {
	id: string;
	name?: string;
	division?: Division;
	chat?: Chat;
	department?: string;
	email?: string;
	primaryContactInfo?: Array<Contact>;
	addresses?: Array<Contact>;
	state?: string;
	title?: string;
	username?: string;
	manager?: User;
	images?: Array<UserImage>;
	version: number;
	certifications?: Array<string>;
	biography?: Biography;
	employerInfo?: EmployerInfo;
	routingStatus?: RoutingStatus;
	presence?: UserPresence;
	integrationPresence?: UserPresence;
	conversationSummary?: UserConversationSummary;
	outOfOffice?: OutOfOffice;
	geolocation?: Geolocation;
	station?: UserStations;
	authorization?: UserAuthorization;
	profileSkills?: Array<string>;
	locations?: Array<Location>;
	groups?: Array<Group>;
	team?: Team;
	skills?: Array<UserRoutingSkill>;
	languages?: Array<UserRoutingLanguage>;
	acdAutoAnswer?: boolean;
	languagePreference?: string;
	lastTokenIssued?: OAuthLastTokenIssued;
	dateLastLogin?: string;
	selfUri?: string;
}

export interface Division {
	id?: string;
	name?: string;
	selfUri?: string;
}

export interface Chat {
	jabberId?: string;
}

export interface Contact {
	address?: string;
	display?: string;
	mediaType?: string;
	type?: string;
	extension?: string;
	countryCode?: string;
	integration?: string;
}

export interface UserImage {
	resolution?: string;
	imageUri?: string;
}

export interface Biography {
	biography?: string;
	interests?: Array<string>;
	hobbies?: Array<string>;
	spouse?: string;
	education?: Array<Education>;
}

export interface Education {
	school?: string;
	fieldOfStudy?: string;
	notes?: string;
	dateStart?: string;
	dateEnd?: string;
}

export interface EmployerInfo {
	officialName?: string;
	employeeId?: string;
	employeeType?: string;
	dateHire?: string;
}

export interface RoutingStatus {
	userId?: string;
	status?: string;
	startTime?: string;
}

export interface UserPresence {
	id?: string;
	name?: string;
	source?: string;
	primary?: boolean;
	presenceDefinition?: PresenceDefinition;
	message?: string;
	modifiedDate?: string;
	selfUri?: string;
}

export interface PresenceDefinition {
	id?: string;
	systemPresence?: string;
	selfUri?: string;
}

export interface UserConversationSummary {
	userId?: string;
	call?: MediaSummary;
	callback?: MediaSummary;
	email?: MediaSummary;
	message?: MediaSummary;
	chat?: MediaSummary;
	socialExpression?: MediaSummary;
	video?: MediaSummary;
}

export interface MediaSummary {
	contactCenter?: MediaSummaryDetail;
	enterprise?: MediaSummaryDetail;
}

export interface MediaSummaryDetail {
	active?: number;
	acw?: number;
}

export interface OutOfOffice {
	id?: string;
	name?: string;
	user?: User;
	startDate?: string;
	endDate?: string;
	active?: boolean;
	indefinite?: boolean;
	selfUri?: string;
}

export interface UserStations {
	associatedStation?: UserStation;
	effectiveStation?: UserStation;
	defaultStation?: UserStation;
	lastAssociatedStation?: UserStation;
}

export interface UserStation {
	id?: string;
	name?: string;
	type?: string;
	associatedUser?: User;
	associatedDate?: string;
	defaultUser?: User;
	providerInfo?: { [key: string]: string };
	webRtcCallAppearances?: number;
}

export interface UserAuthorization {
	roles?: Array<DomainRole>;
	unusedRoles?: Array<DomainRole>;
	permissions?: Array<string>;
	permissionPolicies?: Array<ResourcePermissionPolicy>;
}

export interface ResourcePermissionPolicy {
	id?: string;
	domain?: string;
	entityName?: string;
	policyName?: string;
	policyDescription?: string;
	actionSetKey?: string;
	allowConditions?: boolean;
	resourceConditionNode?: ResourceConditionNode;
	namedResources?: Array<string>;
	resourceCondition?: string;
	actionSet?: Array<string>;
}

export interface ResourceConditionNode {
	variableName?: string;
	conjunction?: string;
	operator?: string;
	operands?: Array<ResourceConditionValue>;
	terms?: Array<ResourceConditionNode>;
}

export interface ResourceConditionValue {
	type?: string;
	value?: string;
}

export interface DomainRole {
	id?: string;
	name?: string;
}

export interface Group {
	id?: string;
	name: string;
	description?: string;
	dateModified?: string;
	memberCount?: number;
	state?: string;
	version?: number;
	type: string;
	images?: Array<UserImage>;
	addresses?: Array<GroupContact>;
	rulesVisible: boolean;
	visibility: string;
	owners?: Array<User>;
	selfUri?: string;
}
export interface GroupContact {
	address: string;
	extension?: string;
	display?: string;
	type: string;
	mediaType: string;
}

export interface Team {
	id?: string;
	name: string;
	division?: WritableDivision;
	description?: string;
	dateCreated?: string;
	dateModified?: string;
	memberCount?: number;
	selfUri?: string;
}
export interface WritableDivision {
	id?: string;
	name?: string;
	selfUri?: string;
}

export interface UserRoutingSkill {
	id?: string;
	name?: string;
	proficiency?: number;
	state?: string;
	skillUri?: string;
	selfUri?: string;
}

export interface UserRoutingLanguage {
	id?: string;
	name?: string;
	proficiency?: number;
	state?: string;
	languageUri?: string;
	selfUri?: string;
}

export interface OAuthLastTokenIssued {
	dateIssued?: string;
}

export interface UserSearchRequest {
	sortOrder?: string;
	sortBy?: string;
	pageSize?: number;
	pageNumber?: number;
	sort?: Array<SearchSort>;
	expand?: Array<string>;
	query?: Array<UserSearchCriteria>;
	integrationPresenceSource?: string;
	enforcePermissions?: boolean;
}

export interface SearchSort {
	sortOrder?: string;
	sortBy?: string;
}

export interface UserSearchCriteria {
	endValue?: string;
	values?: Array<string>;
	startValue?: string;
	value?: string;
	operator?: string;
	group?: Array<UserSearchCriteria>;
	dateFormat?: string;
	fields?: Array<string>;
	type: string;
}

export interface UsersSearchResponse {
	total: number;
	pageCount: number;
	pageSize: number;
	pageNumber: number;
	previousPage?: string;
	currentPage?: string;
	nextPage?: string;
	types: Array<string>;
	results: Array<User>;
}
