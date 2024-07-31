'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import styles from './styles.module.scss';
import Image from 'next/image';
import { Modal, ModalContent, Input, Checkbox } from "@nextui-org/react";

const MainPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const access_token = searchParams.get('access_token');

    const [isLogined, setLogined] = useState(null);
    const [userGuildNick, setUserGuildNick] = useState(null);
    const [access, setAccess] = useState(false);

    const [modalVisible, setModalVisible] = useState(false);
    const [modalContent, setModalContent] = useState(null);

    const items = [
        { name: "Алмаз", value: 1, sprite: "diamond" },
        { name: "Алмазый блок", value: 2, sprite: "diamond-block" },
        { name: "Незеритовый слиток", value: 3, sprite: "netherite-ingot" },
        { name: "Тотем бессметрия", value: 7, sprite: "totem-of-undying" },
    ];

    return (<>
        <Modal
            isOpen={modalVisible}
            onClose={() => {
                setModalVisible(false);
                setModalContent(<></>);
            }}
            hideCloseButton={true}
            backdrop={'opaque'}
            shouldBlockScroll={true}
        >{modalContent}</Modal>
        <div className="content">
            <h1>Ублюдский склад</h1>
            <ul className={styles.items}>
                {items.map((item, id) => (
                    <div key={id} className={styles.item}>
                        <div className={styles.itemInfo}>
                            <div className={styles.itemIcon}>
                                <i className={`${styles.iconMinecraft} ${styles[item.sprite]}`}></i>
                                <div className={styles.itemValue}>{item.value}</div>
                            </div>
                            <div className="itemName">{item.name}</div>
                        </div>
                        <div className={styles.itemButtons}>
                            <button className={`${styles.itemButton} ${styles.add}`}>Добавить</button>
                            <button className={`${styles.itemButton} ${styles.take}`}>Забрать</button>
                        </div>
                    </div>
                ))}
            </ul>
        </div>
    </>);
};

export default MainPage;