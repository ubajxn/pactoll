import { chatInitialStates } from './initial-states/chatStates';
import { layoutInitalStates } from './initial-states/layoutStates';
import { chatPopupinitStates } from './initial-states/chatPopupInitStates';
import { emailInitialStates } from './initial-states/emailInitialStates';
import { todoInitialState } from './initial-states/todoInitialState';
import { chatGroupStates } from './initial-states/chatGroupStates';

export const initialStates = {
    ...layoutInitalStates,
    ...chatInitialStates,
    ...chatGroupStates,
    ...chatPopupinitStates,
    ...emailInitialStates,
    ...todoInitialState
};
export const GlobalReducer = (state, action) => {
    switch (action.type) {
        //layout reducers
        case "sidebar_toggle": {
            return {
                ...state,
                isSidebarCollapsed: !state.isSidebarCollapsed
            };
        };
        case 'collapse_sidebar':
            return {
                ...state,
                isSidebarCollapsed: true,
            };
        case 'expand_sidebar':
            return {
                ...state,
                isSidebarCollapsed: false,
            };
        case "top_nav_toggle":
            return {
                ...state,
                topNavCollapse: !state.topNavCollapse
            };
        case "data_hover":
            return {
                ...state,
                dataHover: action.dataHover
            };
        //chat reducers
        case "start_chat":
            return {
                ...state,
                startChat: !state.startChat
            };
        case "send_msg":
            return {
                ...state,
                msg: [...state.msg, action.msg]
            };
        case "set_user":
            return {
                ...state,
                userId: action.userId,
                avatar: action.avatar,
                userName: action.userName,
                status: action.status
            };
        case "contact_msg":
            return {
                ...state,
                contactMsg: [...state.contactMsg, action.contactMsg]
            };
        case "reply_msg":
            return {
                ...state,
                rplyMsg: [...state.rplyMsg, action.rplyMsg]
            };
        //Chat Group reducers
        case "grp_msg":
            return {
                ...state,
                grpMsg: [...state.grpMsg, action.grpMsg]
            };
        case "select_group":
            return {
                ...state,
                grpId: action.grpId,
                grpAvatar: action.grpAvatar,
                groupName: action.groupName,
                grpStatus: action.grpStatus,
            };
        //Popup reducers
        case "send_popup_msg":
            return {
                ...state,
                popupMsgs: [...state.popupMsgs, action.popupMsgs]
            };
        case "send_direct_msg":
            return {
                ...state,
                directMsgs: [...state.directMsgs, action.directMsgs]
            };
        //Email reducers
        case "compose_email":
            return {
                ...state,
                composeEmail: action.composeEmail
            };
        case "maximize_modal":
            return {
                ...state,
                maximize: action.maximize
            };
        case "minimize_modal":
            return {
                ...state,
                minimize: action.minimize
            };
        //Todo reducers
        case "change_vm":
            return {
                ...state,
                vm: action.vm
            };
        default:
            return state;
    }
};