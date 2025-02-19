export type JWT = string;
export type DomainName = string;
export type UserQuery = string;
export type StringDoaGddGA = string;
/**
 *
 * Generated! Represents an alias to any of the provided schemas
 *
 */
export type AnyOfJWTJWTDomainNameUserQueryStringDoaGddGAStringDoaGddGA = JWT | DomainName | UserQuery | StringDoaGddGA;
export type CreateUser = (JWT: JWT) => Promise<StringDoaGddGA>;
export type AgentWebsearch = (JWT: JWT, domain_name: DomainName, user_query: UserQuery) => Promise<StringDoaGddGA>;