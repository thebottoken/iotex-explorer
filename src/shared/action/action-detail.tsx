import notification from "antd/lib/notification";
import Table from "antd/lib/table";
import { get } from "dottie";
import { publicKeyToAddress } from "iotex-antenna/lib/crypto/crypto";
// @ts-ignore
import { t } from "onefx/lib/iso-i18n";
import React, { PureComponent } from "react";
import { Query, QueryResult } from "react-apollo";
import { RouteComponentProps, withRouter } from "react-router";
import { GetActionsResponse } from "../../api-gateway/resolvers/antenna-types";
import { columns } from "../block/block-detail";
import { Flex } from "../common/flex";
import { PageTitle } from "../common/page-title";
import { SpinPreloader } from "../common/spin-preloader";
import { colors } from "../common/styles/style-color";
import { ContentPadding } from "../common/styles/style-padding";
import { GET_ACTIONS_BY_HASH } from "../queries";

type PathParamsType = {
  hash: string;
};

type Props = RouteComponentProps<PathParamsType> & {};

class ActionDetailsInner extends PureComponent<Props> {
  public render(): JSX.Element {
    const {
      match: {
        params: { hash }
      }
    } = this.props;

    return (
      <ContentPadding>
        <Query
          query={GET_ACTIONS_BY_HASH}
          variables={{ byHash: { actionHash: hash, checkingPending: true } }}
        >
          {({
            loading,
            error,
            data
          }: QueryResult<{ getActions: GetActionsResponse }>) => {
            if (error) {
              notification.error({
                message: "Error",
                description: `failed to get account: ${error}`,
                duration: 3
              });
              return `failed to get account: ${error}`;
            }

            const actionInfo =
              (data &&
                data.getActions &&
                data.getActions.actionInfo &&
                data.getActions.actionInfo[0]) ||
              {};

            // @ts-ignore
            const { actHash, blkHash, action } = actionInfo;
            const { ...other } =
              action && action.core
                ? action.core.execution ||
                  action.core.grantReward ||
                  action.core.transfer
                : {};

            const actionUnion = {
              actHash,
              blkHash,
              ...other,
              sender: action
                ? publicKeyToAddress(String(action.senderPubKey))
                : ""
            };

            delete actionUnion.__typename;

            actionUnion.actionType = undefined;
            if (get(actionInfo, "action.core.transfer")) {
              actionUnion.actionType = t("action.type.transfer");
            }
            if (get(actionInfo, "action.core.execution")) {
              actionUnion.actionType = t("action.type.execution");
            }
            if (get(actionInfo, "action.core.grantReward")) {
              actionUnion.actionType = t("action.type.grant_reward");
            }

            const dataSource = Object.keys(actionUnion).map(key => ({
              key,
              value: actionUnion[key]
            }));

            return (
              <SpinPreloader spinning={loading}>
                <Flex
                  width={"100%"}
                  column={true}
                  alignItems={"baselines"}
                  backgroundColor={colors.white}
                >
                  <PageTitle>{t("action.action")}</PageTitle>
                  <Table
                    pagination={false}
                    dataSource={dataSource}
                    columns={columns}
                    rowKey={"key"}
                    style={{ width: "100%" }}
                    scroll={{ x: false }}
                  />
                </Flex>
              </SpinPreloader>
            );
          }}
        </Query>
      </ContentPadding>
    );
  }
}

export const ActionDetail = withRouter(ActionDetailsInner);
