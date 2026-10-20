import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { Button, Dropdown } from 'react-bootstrap';
import { ArrowDown, CornerUpRight, MoreHorizontal } from 'react-feather';
import SimpleBar from 'simplebar-react';
import { useGlobalStateContext } from '@/context/GolobalStateProvider';

//Images

const ChatBody = () => {
    const { states } = useGlobalStateContext();
    const [messages, setMessages] = useState([]);

    //Get New Messages
    useEffect(() => {
        setMessages(states.chatState.msg);
    }, [states.chatState, messages]);

    // 👇️ scroll to bottom every time messages change
    const bottomRef = useRef(null);
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);


    return (
        <SimpleBar style={{ height: "100%" }} id="chat_body" className="chat-body">
            <ul id="dummy_avatar" className="list-unstyled chat-single-list">
                <li className="media received">
                    <div className="avatar avatar-xs avatar-rounded">
                        {states.chatState.avatar.type === "img" && <Image src={states.chatState.avatar.src} alt="user" className="avatar-img" />}
                        {states.chatState.avatar.type === "init" && <div className={`avatar avatar-xs avatar-${states.chatState.avatar.variant} avatar-rounded`}>
                            <span className="initial-wrap">{states.chatState.avatar.title}</span>
                        </div>}
                    </div>
                    <div className="media-body">
                        <div className="msg-box">
                            <div>
                                <p>The website redesign content audit is done. I mapped out the new IA structure with dedicated steel sales pages and the RFQ form flow.</p>
                                <span className="chat-time">10:52 AM</span>
                            </div>
                            <div className="msg-action">
                                <Button className="btn-icon btn-flush-dark btn-rounded flush-soft-hover no-caret">
                                    <span className="icon">
                                        <span className="feather-icon">
                                            <CornerUpRight />
                                        </span>
                                    </span>
                                </Button>
                                <Dropdown>
                                    <Dropdown.Toggle variant="flush-dark" className="btn-icon btn-rounded flush-soft-hover dropdown-toggle no-caret">
                                        <span className="icon">
                                            <span className="feather-icon">
                                                <MoreHorizontal />
                                            </span>
                                        </span>
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu align="end">
                                        <Dropdown.Item href="#forward">Forward</Dropdown.Item>
                                        <Dropdown.Item href="#copy">Copy</Dropdown.Item>
                                    </Dropdown.Menu>
                                </Dropdown>
                            </div>
                        </div>
                        <div className="msg-box">
                            <div>
                                <p>Also sending over the facility photography schedule. We need shots of the slitting line, leveler, and the new cut-to-length setup.</p>
                                <span className="chat-time">10:53 AM</span>
                            </div>
                            <div className="msg-action">
                                <Button className="btn-icon btn-flush-dark btn-rounded flush-soft-hover no-caret">
                                    <span className="icon">
                                        <span className="feather-icon">
                                            <CornerUpRight />
                                        </span>
                                    </span>
                                </Button>
                                <Dropdown>
                                    <Dropdown.Toggle variant="flush-dark" className="btn-icon btn-rounded flush-soft-hover dropdown-toggle no-caret">
                                        <span className="icon">
                                            <span className="feather-icon">
                                                <MoreHorizontal />
                                            </span>
                                        </span>
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu align="end">
                                        <Dropdown.Item href="#forward">Forward</Dropdown.Item>
                                        <Dropdown.Item href="#copy">Copy</Dropdown.Item>
                                    </Dropdown.Menu>
                                </Dropdown>
                            </div>
                        </div>
                    </div>
                </li>
                <li className="media media-attachment received">
                    <div className="avatar avatar-xs avatar-rounded">
                        {states.chatState.avatar.type === "img" && <Image src={states.chatState.avatar.src} alt="user" className="avatar-img" />}
                        {states.chatState.avatar.type === "init" && <div className={`avatar avatar-xs avatar-${states.chatState.avatar.variant} avatar-rounded`}>
                            <span className="initial-wrap">{states.chatState.avatar.title}</span>
                        </div>}
                    </div>
                    <div className="media-body msg-docs">
                        <div className="msg-box">
                            <div>
                                <div className="media">
                                    <div className="avatar avatar-icon avatar-sm avatar-blue">
                                        <span className="initial-wrap fs-3">
                                            <i className="ri-file-excel-2-fill" />
                                        </span>
                                    </div>
                                    <div className="media-body">
                                        <p className="file-name">PTP_Target_Accounts.xls</p>
                                        <p className="file-size">2,635 KB</p>
                                    </div>
                                </div>
                                <div className="file-overlay">
                                    <Button variant="primary" size="sm" className="btn-icon btn-rounded">
                                        <span className="icon">
                                            <span className="feather-icon">
                                                <ArrowDown />
                                            </span>
                                        </span>
                                    </Button>
                                </div>
                            </div>
                        </div>
                        <div className="msg-box">
                            <div>
                                <div className="media">
                                    <div className="avatar avatar-icon avatar-sm avatar-warning">
                                        <span className="initial-wrap fs-3">
                                            <i className="ri-file-zip-fill" />
                                        </span>
                                    </div>
                                    <div className="media-body">
                                        <p className="file-name">PTP_Campaign_Deliverables.zip</p>
                                        <p className="file-size">148 MB</p>
                                    </div>
                                </div>
                                <div className="file-overlay">
                                    <Button variant="primary" size="sm" className="btn-icon btn-rounded">
                                        <span className="icon">
                                            <span className="feather-icon">
                                                <ArrowDown />
                                            </span>
                                        </span>
                                    </Button>
                                </div>
                            </div>
                            <div className="msg-action">
                                <Button className="btn-icon btn-flush-dark btn-rounded flush-soft-hover no-caret">
                                    <span className="icon">
                                        <span className="feather-icon">
                                            <CornerUpRight />
                                        </span>
                                    </span>
                                </Button>
                                <Dropdown>
                                    <Dropdown.Toggle variant="flush-dark" className="btn-icon btn-rounded flush-soft-hover dropdown-toggle no-caret">
                                        <span className="icon">
                                            <span className="feather-icon">
                                                <MoreHorizontal />
                                            </span>
                                        </span>
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu align="end">
                                        <Dropdown.Item href="#forward">Forward</Dropdown.Item>
                                        <Dropdown.Item href="#copy">Copy</Dropdown.Item>
                                    </Dropdown.Menu>
                                </Dropdown>
                            </div>
                        </div>
                    </div>
                </li>
                <li className="day-sep">
                    <span>Today</span>
                </li>
                <li className="media sent">
                    <div className="media-body">
                        <div className="msg-box">
                            <div>
                                <p>Got it. I will set up the LinkedIn campaign targeting the automotive and construction sectors first. We have 36 automotive targets and 57 construction targets ready for outreach.</p>
                                <span className="chat-time">11:15 AM</span>
                            </div>
                            <div className="msg-action">
                                <Button className="btn-icon btn-flush-dark btn-rounded flush-soft-hover no-caret">
                                    <span className="icon">
                                        <span className="feather-icon">
                                            <CornerUpRight />
                                        </span>
                                    </span>
                                </Button>
                                <Dropdown>
                                    <Dropdown.Toggle variant="flush-dark" className="btn-icon btn-rounded flush-soft-hover dropdown-toggle no-caret">
                                        <span className="icon">
                                            <span className="feather-icon">
                                                <MoreHorizontal />
                                            </span>
                                        </span>
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu align="end">
                                        <Dropdown.Item href="#forward">Forward</Dropdown.Item>
                                        <Dropdown.Item href="#copy">Copy</Dropdown.Item>
                                    </Dropdown.Menu>
                                </Dropdown>
                            </div>
                        </div>
                    </div>
                </li>
                <li className="media received">
                    <div className="avatar avatar-xs avatar-rounded">
                        {states.chatState.avatar.type === "img" && <Image src={states.chatState.avatar.src} alt="user" className="avatar-img" />}
                        {states.chatState.avatar.type === "init" && <div className={`avatar avatar-xs avatar-${states.chatState.avatar.variant} avatar-rounded`}>
                            <span className="initial-wrap">{states.chatState.avatar.title}</span>
                        </div>}
                    </div>
                    <div className="media-body">
                        <div className="msg-box">
                            <div>
                                <p>The directory listings for Thomas Register, MacRAE&apos;s, and SteelOrbis are all submitted. Waiting on verification for Metal Center News.</p>
                                <span className="chat-time">1:45 PM</span>
                            </div>
                            <div className="msg-action">
                                <Button className="btn-icon btn-flush-dark btn-rounded flush-soft-hover no-caret">
                                    <span className="icon">
                                        <span className="feather-icon">
                                            <CornerUpRight />
                                        </span>
                                    </span>
                                </Button>
                                <Dropdown>
                                    <Dropdown.Toggle variant="flush-dark" className="btn-icon btn-rounded flush-soft-hover dropdown-toggle no-caret">
                                        <span className="icon">
                                            <span className="feather-icon">
                                                <MoreHorizontal />
                                            </span>
                                        </span>
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu align="end">
                                        <Dropdown.Item href="#forward">Forward</Dropdown.Item>
                                        <Dropdown.Item href="#copy">Copy</Dropdown.Item>
                                    </Dropdown.Menu>
                                </Dropdown>
                            </div>
                        </div>
                    </div>
                </li>
                <li className="media sent">
                    <div className="media-body">
                        <div className="msg-box">
                            <div>
                                <p>The FABTECH booth layout is confirmed. We have the steel sample display, the ASMR video loop station, and the RFQ tablet kiosk all mapped out.</p>
                                <span className="chat-time">2:30 PM</span>
                            </div>
                            <div className="msg-action">
                                <Button className="btn-icon btn-flush-dark btn-rounded flush-soft-hover no-caret">
                                    <span className="icon">
                                        <span className="feather-icon">
                                            <CornerUpRight />
                                        </span>
                                    </span>
                                </Button>
                                <Dropdown>
                                    <Dropdown.Toggle variant="flush-dark" className="btn-icon btn-rounded flush-soft-hover dropdown-toggle no-caret">
                                        <span className="icon">
                                            <span className="feather-icon">
                                                <MoreHorizontal />
                                            </span>
                                        </span>
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu align="end">
                                        <Dropdown.Item href="#forward">Forward</Dropdown.Item>
                                        <Dropdown.Item href="#copy">Copy</Dropdown.Item>
                                    </Dropdown.Menu>
                                </Dropdown>
                            </div>
                        </div>
                    </div>
                </li>
                <li className="media received">
                    <div className="avatar avatar-xs avatar-rounded">
                        {states.chatState.avatar.type === "img" && <Image src={states.chatState.avatar.src} alt="user" className="avatar-img" />}
                        {states.chatState.avatar.type === "init" && <div className={`avatar avatar-xs avatar-${states.chatState.avatar.variant} avatar-rounded`}>
                            <span className="initial-wrap">{states.chatState.avatar.title}</span>
                        </div>}
                    </div>
                    <div className="media-body">
                        <div className="msg-box">
                            <div>
                                <p>Quick update on the pipeline. Royal Truck Body and West Coast Metal Stamping both responded to our LinkedIn outreach. Moving them from awareness to engagement stage.</p>
                                <span className="chat-time">9:20 AM</span>
                            </div>
                            <div className="msg-action">
                                <Button className="btn-icon btn-flush-dark btn-rounded flush-soft-hover no-caret">
                                    <span className="icon">
                                        <span className="feather-icon">
                                            <CornerUpRight />
                                        </span>
                                    </span>
                                </Button>
                                <Dropdown>
                                    <Dropdown.Toggle variant="flush-dark" className="btn-icon btn-rounded flush-soft-hover dropdown-toggle no-caret">
                                        <span className="icon">
                                            <span className="feather-icon">
                                                <MoreHorizontal />
                                            </span>
                                        </span>
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu align="end">
                                        <Dropdown.Item href="#forward">Forward</Dropdown.Item>
                                        <Dropdown.Item href="#copy">Copy</Dropdown.Item>
                                    </Dropdown.Menu>
                                </Dropdown>
                            </div>
                        </div>
                    </div>
                </li>
                {
                    messages.map((elem, index) => (
                        <li className={classNames("media", (elem.types))} key={index}>
                            {elem.types === "received" && <div className="avatar avatar-xs avatar-rounded">
                                {states.chatState.avatar.type === "img" && <Image src={states.chatState.avatar.src} alt="user" className="avatar-img" />}
                                {states.chatState.avatar.type === "init" && <div className={`avatar avatar-xs avatar-${states.chatState.avatar.variant} avatar-rounded`}>
                                    <span className="initial-wrap">{states.chatState.avatar.title}</span>
                                </div>}
                            </div>}
                            <div className="media-body">
                                <div className="msg-box" id="msg-1" >
                                    <div>
                                        <p>{elem.text}</p>
                                        <span className="chat-time">{elem.time}</span>
                                    </div>
                                    <div className="msg-action">
                                        <Button className="btn-icon btn-flush-dark btn-rounded flush-soft-hover no-caret">
                                            <span className="icon">
                                                <span className="feather-icon">
                                                    <CornerUpRight />
                                                </span>
                                            </span>
                                        </Button>
                                        <Dropdown>
                                            <Dropdown.Toggle variant="flush-dark" className="btn-icon btn-rounded flush-soft-hover dropdown-toggle no-caret">
                                                <span className="icon">
                                                    <span className="feather-icon">
                                                        <MoreHorizontal />
                                                    </span>
                                                </span>
                                            </Dropdown.Toggle>
                                            <Dropdown.Menu align="end">
                                                <Dropdown.Item href="#forward">Forward</Dropdown.Item>
                                                <Dropdown.Item href="#copy">Copy</Dropdown.Item>
                                            </Dropdown.Menu>
                                        </Dropdown>
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))
                }
            </ul>
            <div ref={bottomRef} />
        </SimpleBar>
    )
}

export default ChatBody;