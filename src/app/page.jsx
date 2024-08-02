'use client';

import './styles.scss';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Modal, ModalContent } from "@nextui-org/react";
import { getAllPoints, udpatePoint } from '@/services/pointsManager';
import { checkUser, logoutUser } from '@/services/userManager';
import { Golos_Text } from 'next/font/google';

const golos = Golos_Text({
    subsets: ['cyrillic', 'latin'],
});

const updateItem = (array, index, newItem) =>
    array.map((item, i) => (i === index ? newItem : item));

const MainPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const errorParam = searchParams.get('error');
    const nickParam = searchParams.get('nick');
    const avatarParam = searchParams.get('avatar');
    const rolesParam = JSON.parse(searchParams.get('roles'));
    const accessToken = searchParams.get('accessToken');

    const [isLogined, setIsLogined] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [userGuildNick, setUserGuildNick] = useState(null);

    const discordVillageRoleId = '1211782261620346880';
    const discordAdminsIds = ['1211781664955437207', '1212633431251484692', '1212633560947892234'];

    const [modalVisible, setModalVisible] = useState(false);
    const [modalState, setModalState] = useState(null);
    const [modalError, setModalError] = useState('');

    const pointId = useRef(-1);
    const inputChangeValue = useRef('');
    const maxInputValue = 60_000;

    const [points, setPoints] = useState([]);

    useEffect(() => {
        if (accessToken || nickParam || rolesParam || errorParam) {
            router.replace('/');
        }
        (async () => {
            if (isLogined === null) {
                if (errorParam) {
                    setIsLogined(false);
                    setModalError(errorParam);
                    return;
                }
                if (accessToken) {
                    const { token } = JSON.parse(accessToken);
                    if (token.length === 30 && nickParam && rolesParam) {
                        localStorage.setItem('secret', accessToken);
                        if (rolesParam.includes(discordVillageRoleId) === true) {
                            setIsLogined(true);
                            setUserGuildNick(nickParam);
                            setIsAdmin(rolesParam.some(item => discordAdminsIds.includes(item)));
                            const [result, error] = await getAllPoints();
                            if (error) return;
                            setPoints(result);
                        } else {
                            setIsLogined(false);
                            setModalError('Ты не житель Ублюдска');
                        }
                    }
                    return;
                }
                const secret = localStorage.getItem('secret');
                if (secret) {
                    const [result, error] = await checkUser(JSON.parse(secret).token, JSON.parse(secret).userId);
                    if (error) {
                        setModalError(error.error);
                        return;
                    }
                    if (result.roles.includes(discordVillageRoleId) === true) {
                        setIsLogined(true);
                        setUserGuildNick(result.nick);
                        setIsAdmin(result.roles.some(item => discordAdminsIds.includes(item)));
                        const [getAllPoints_result, getAllPoints_error] = await getAllPoints();
                        if (getAllPoints_error) return;
                        setPoints(getAllPoints_result);
                    } else {
                        setIsLogined(false);
                        setModalError('Ты не житель Ублюдска');
                    }
                    return;
                }
                setIsLogined(false);
            }
        })();
    }, [isLogined, router, errorParam, nickParam, avatarParam, rolesParam, accessToken]);

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
        const timezoneOffset = 0 * 60;
        const newDate = new Date(new Date().getTime() + timezoneOffset * 60 * 1000);
        const [, error] = await udpatePoint({ player: userGuildNick, sprite: points[pointId.current].sprite, prevValue: points[pointId.current].value, value: newValue, updatedAt: newDate });
        if (error) return;
        const [newPoints] = await getAllPoints();
        setPoints(newPoints);
        closeModal();
    };
    const takePointValue = async (value) => {
        const newValue = points[pointId.current].value - parseInt(value);
        if (newValue < 0) {
            setModalError(`Не дохера ли ты хочешь? На складе: ${points[pointId.current].value}`);
            return;
        }
        const timezoneOffset = 0 * 60;
        const newDate = new Date(new Date().getTime() + timezoneOffset * 60 * 1000);
        const [, error] = await udpatePoint({ player: userGuildNick, sprite: points[pointId.current].sprite, prevValue: points[pointId.current].value, value: newValue, updatedAt: newDate });
        if (error) return;
        const [newPoints] = await getAllPoints();
        setPoints(newPoints);
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
                    <button onClick={async () => {
                        const secret = localStorage.getItem('secret');
                        if (secret) {
                            await logoutUser(JSON.parse(secret).token);
                            setIsLogined(false);
                            setIsAdmin(false);
                            setUserGuildNick(null);
                            localStorage.removeItem('secret');
                        }
                    }}>Выйти</button>
                </div>}
            </div>
            {isLogined === true ? <>
                <ul className="panel">
                    {points && points.sort((a, b) => a.name.localeCompare(b.name)).map((point, id) => (
                        <div key={id} className="point">
                            <div className="flex gap-[70px]">
                                <div className="pointIcon">
                                    <i className={`iconMinecraft ${point.sprite}`}></i>
                                    <div className="pointValue">{point.value}</div>
                                </div>
                                <div className="pointInfo">
                                    <div className="pointName">{point.name}</div>
                                    <div>
                                        {(point.updatedAt && point.prevValue >= 0) && (<>
                                            {point.prevValue > point.value ?
                                                `Забрал ${point.prevValue - point.value} (${new Date(point.updatedAt).toLocaleDateString()} в ${new Date(point.updatedAt).toLocaleTimeString()})`
                                                : `Положил ${point.value - point.prevValue} (${new Date(point.updatedAt).toLocaleDateString()} в ${new Date(point.updatedAt).toLocaleTimeString()})`}
                                        </>)}
                                    </div>
                                </div>
                            </div>
                            <div className="panelButtons">
                                <button
                                    className="panelButton add"
                                    onClick={() => openAddModal(id)}
                                >Добавить</button>
                                <button
                                    className={`panelButton take ${point.value < 1 ? '' : 'active'}`}
                                    onClick={() => openTakeModal(point.value, id)}
                                >Забрать</button>
                            </div>
                        </div>
                    ))}
                </ul>
                <div className="panel py-[20px] px-[40px]">
                    <p className="title">Админ панель</p>
                    <div className="panelButtons">
                        <button
                            className="panelButton add"
                            onClick={() => { }}
                        >Добавить</button>
                        <button
                            className="panelButton take active"
                            onClick={() => { }}
                        >Убрать</button>
                    </div>
                </div>
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
            </div> : <div className="loginWrapper">
                <p className="title">пажжи чут чут🤏</p>
                <p className='text-[20px] text-red-500 mt-[10px]'>
                    {modalError}
                </p>
            </div>}
        </div>
    </>);
};

export default MainPage;