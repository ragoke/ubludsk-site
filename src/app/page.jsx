'use client';

import './styles.scss';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Modal, ModalContent } from "@nextui-org/react";
import { getAllPoints, udpatePoint } from '@/services/pointsManager';
import { checkUser } from '@/services/userManager';
import { Golos_Text } from 'next/font/google';

const golos = Golos_Text({
    subsets: ['cyrillic', 'latin'],
});

const updateItem = (array, index, newItem) =>
    array.map((item, i) => (i === index ? newItem : item));

const MainPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const error_param = searchParams.get('error');
    const nick_param = searchParams.get('nick');
    const avatar_param = searchParams.get('avatar');
    const roles_param = JSON.parse(searchParams.get('roles'));
    const access_token = searchParams.get('access_token');

    const [isLogined, setIsLogined] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [userGuildNick, setUserGuildNick] = useState(null);

    const discordVillageRoleId = '1211782261620346880';

    const [modalVisible, setModalVisible] = useState(false);
    const [modalState, setModalState] = useState(null);
    const [modalError, setModalError] = useState('');

    const pointId = useRef(-1);
    const inputChangeValue = useRef('');
    const maxInputValue = 60_000;

    const [points, setPoints] = useState([]);

    useEffect(() => {
        if (access_token || nick_param || roles_param || error_param) {
            router.replace('/');
        }
        (async () => {
            if (isLogined === null) {
                if (error_param) {
                    setModalError(error_param);
                    return;
                }
                if (access_token) {
                    if (access_token.length === 30 && nick_param && roles_param) {
                        localStorage.setItem('secret', access_token);
                        if (roles_param.includes(discordVillageRoleId) === true) {
                            setIsLogined(true);
                            setUserGuildNick(nick_param);
                            const [result, error] = await getAllPoints();
                            if (error) return;
                            setPoints(result);
                        } else {
                            setIsLogined(false);
                            setModalError('Ты не житель Ублюдска');
                        }
                        // setIsAdmin(roles_param);
                    }
                }
                const secret = localStorage.getItem('secret');
                if (secret) {
                    const [result, error] = await checkUser(secret);
                    if (error) {
                        setIsLogined(false);
                        setModalError(error);
                        localStorage.removeItem('secret');
                        return;
                    }
                    if (result.roles.includes(discordVillageRoleId) === true) {
                        setIsLogined(true);
                        setIsAdmin(result.admin);
                        setUserGuildNick(result.nick);
                        localStorage.setItem('secret', result.access_token);
                        const [getAllPoints_result, getAllPoints_error] = await getAllPoints();
                        if (getAllPoints_error) return;
                        setPoints(getAllPoints_result);
                    } else {
                        setIsLogined(false);
                        setModalError('Ты не житель Ублюдска');
                    }
                    return;
                }
            }
        })();
    }, [isLogined, router, error_param, nick_param, avatar_param, roles_param, access_token]);

    const isEmptyString = (str) => {
        return !str.trim();
    };

    const hasSpecialChars = (str) => {
        const specialChars = /[\[\]{}\\/!@#\$%\^\&*\)\(+=.\-`]+/;
        return specialChars.test(str);
    };

    const isInteger = (str) => {
        return /^-?\d+$/.test(str);
    };

    const openAddModal = (id) => {
        setModalVisible(true);
        setModalState('add');
        pointId.current = id;
    };

    const openTakeModal = (value, id) => {
        if (value < 1) return;
        setModalVisible(true);
        setModalState('take');
        pointId.current = id;
    };

    const closeModal = async () => {
        setModalVisible(false);
        setModalState(null);
        setModalError('');
        pointId.current = -1;
    };

    const addPointValue = async (value) => {
        const newValue = points[pointId.current].value + parseInt(value);
        if (newValue < 0) return;
        const [, error] = await udpatePoint({ player: userGuildNick, sprite: points[pointId.current].sprite, value: newValue });
        if (error) return;
        setPoints(p => updateItem(p, pointId.current, { ...p[pointId.current], value: newValue }));
        closeModal();
    };
    const takePointValue = async (value) => {
        const newValue = points[pointId.current].value - parseInt(value);
        if (newValue < 0) {
            setModalError(`Не дохера ли ты хочешь? На складе: ${points[pointId.current].value}`);
            return;
        }
        const [, error] = await udpatePoint({ player: userGuildNick, sprite: points[pointId.current].sprite, value: newValue });
        if (error) return;
        setPoints(p => updateItem(p, pointId.current, { ...p[pointId.current], value: newValue }));
        closeModal();
    };

    const numberWithSpaces = (x) => {
        let parts = x.toString().split(".");
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
        return parts.join(".");
    };

    return (<>
        <Modal
            isOpen={modalVisible}
            onClose={closeModal}
            hideCloseButton={true}
            backdrop={'opaque'}
            shouldBlockScroll={true}
            classNames={{
                wrapper: 'items-center'
            }}
        >
            {modalState === 'add' ? <>
                <ModalContent className='rounded-3xl select-none max-w-max p-[40px]'>
                    <p className="modalTitle">Сколько ты хочешь добавить?</p>
                    <div className="inputWrapper">
                        <input
                            type="text" placeholder="Количество"
                            className={golos.className}
                            onChange={e => {
                                setModalError('');
                                if (isEmptyString(e.target.value) === true) return;
                                if (hasSpecialChars(e.target.value) === true) {
                                    setModalError('Специальные символы запрещены ! @ # $ % & ^ * \\ / + - = . `');
                                    return;
                                }
                                if (isInteger(e.target.value) === false) {
                                    setModalError('Только число');
                                    return;
                                }
                                if (parseInt(e.target.value) > maxInputValue) {
                                    setModalError(`Не больше чем ${numberWithSpaces(maxInputValue)}`);
                                    return;
                                }
                                inputChangeValue.current = e.target.value;
                            }}
                        />
                        <div className="buttons">
                            <button onClick={() => addPointValue(inputChangeValue.current)}>Добавить</button>
                        </div>
                    </div>
                    <p className='text-[20px] text-red-500 mt-[10px]'>
                        {modalError}
                    </p>
                </ModalContent>
            </> : modalState === 'take' ? <>
                <ModalContent className='rounded-3xl select-none max-w-max p-[40px]'>
                    <p className="modalTitle">Сколько ты хочешь забрать?</p>
                    <div className="inputWrapper">
                        <input
                            type="text" placeholder="Количество"
                            className={golos.className}
                            onChange={e => {
                                setModalError('');
                                if (isEmptyString(e.target.value) === true) return;
                                if (hasSpecialChars(e.target.value) === true) {
                                    setModalError('Специальные символы запрещены ! @ # $ % & ^ * \\ / + - = . `');
                                    return;
                                }
                                if (isInteger(e.target.value) === false) {
                                    setModalError('Только число');
                                    return;
                                }
                                if (parseInt(e.target.value) > maxInputValue) {
                                    setModalError(`Не больше чем ${numberWithSpaces(maxInputValue)}`);
                                    return;
                                }
                                inputChangeValue.current = e.target.value;
                            }}
                        />
                        <div className="buttons">
                            <button onClick={() => takePointValue(inputChangeValue.current)}>Забрать</button>
                        </div>
                    </div>
                    <p className='text-[20px] text-red-500 mt-[10px]'>
                        {modalError}
                    </p>
                </ModalContent>
            </> : <></>}
        </Modal>

        <div className="content">
            <div className={`flex my-[40px] mx-[140px] items-center ${isLogined === true ? 'justify-between' : ''}`}>
                <h1>Ублюдский склад</h1>
                {isLogined === true && <div className="buttons" items="center">
                    <p className="text-2xl">{userGuildNick && `${userGuildNick}`}</p>
                    <button onClick={() => {
                        setIsLogined(false);
                        setIsAdmin(false);
                        setUserGuildNick(null);
                        localStorage.removeItem('secret');
                    }}>Выйти</button>
                </div>}
            </div>
            {isLogined === true ? <>
                <ul className="points">
                    {points.sort((a, b) => a.name.localeCompare(b.name)).map((point, id) => (
                        <div key={id} className="point">
                            <div className="pointInfo">
                                <div className="pointIcon">
                                    <i className={`iconMinecraft ${point.sprite}`}></i>
                                    <div className="pointValue">{point.value}</div>
                                </div>
                                <div className="pointName">{point.name}</div>
                            </div>
                            <div className="pointButtons">
                                <button
                                    className="pointButton add"
                                    onClick={() => openAddModal(id)}
                                >Добавить</button>
                                <button
                                    className={`pointButton take ${point.value < 1 ? '' : 'active'}`}
                                    onClick={() => openTakeModal(point.value, id)}
                                >Забрать</button>
                            </div>
                        </div>
                    ))}
                </ul>
                {/* <div className="adminAccess">
                    <p className="title">Админ панель</p>
                    <div className="pointButtons">
                        <button
                            className="pointButton add"
                            onClick={() => { }}
                        >Добавить</button>
                        <button
                            className={`pointButton take active`}
                            onClick={() => { }}
                        >Убрать</button>
                    </div>
                </div> */}
            </> : isLogined === false ? <div className="loginWrapper">
                <p className="title">Войди в аккаунт</p>
                <br />
                <div className="buttons" columns="true">
                    <button onClick={() => {
                        router.push(`https://discord.com/oauth2/authorize?client_id=1268253525771681855&response_type=code&redirect_uri=${encodeURIComponent(process.env.NEXT_PUBLIC_REDIRECT_URL + 'api/auth/callback/')}&scope=identify+guilds+guilds.members.read`);
                    }}>Войти через Discord</button>
                    <p className='text-[20px] text-red-500 mt-[10px]'>
                        {modalError}
                    </p>
                </div>
            </div> : <div className="loginWrapper"><p className="title">пажжи чут чут🤏</p></div>}
        </div>
    </>);
};

export default MainPage;